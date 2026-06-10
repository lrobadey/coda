import { tool } from "@openai/agents";
import OpenAI from "openai";
import { z } from "zod";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
const TAVILY_EXTRACT_URL = "https://api.tavily.com/extract";

const EXTRACT_MODEL = process.env.OPENAI_EXTRACT_MODEL || "gpt-5-mini";
// How much cleaned page content the distillation model reads. This is a
// one-time, cheap-model cost per page — keep it generous so deadlines that
// appear mid-page are not cut off.
const MAX_DISTILL_INPUT_CHARS = 14000;
// Cleaned-content excerpt returned alongside the distilled facts, and the
// fallback payload when distillation fails.
const EXCERPT_CHARS = 1500;
const FALLBACK_CONTENT_CHARS = 8000;

let openaiClient = null;
function getOpenAI() {
  if (!openaiClient) openaiClient = new OpenAI();
  return openaiClient;
}

function cleanText(value, maxLength = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

// Tavily markdown is dominated by nav links, image refs, and whitespace.
// Flatten that noise so the distillation budget is spent on real prose.
// Links whose text or URL looks application-related keep their URL.
function cleanMarkdown(raw) {
  return String(raw || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) =>
      /apply|application|deadline|guidelines|submit|form|register/i.test(`${text} ${url}`)
        ? `${text} (${url})`
        : text
    )
    .replace(/^[\s>*\-_|#=]+$/gm, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const PAGE_FACTS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "deadline",
    "deadline_quote",
    "eligibility",
    "award",
    "location",
    "application_url",
  ],
  properties: {
    title: { type: ["string", "null"], description: "Name of the opportunity or page." },
    summary: { type: ["string", "null"], description: "2-3 sentence summary of the opportunity." },
    deadline: {
      type: ["string", "null"],
      description: "Application deadline in YYYY-MM-DD if determinable, otherwise the verbatim deadline phrasing. Null if no deadline appears on the page.",
    },
    deadline_quote: {
      type: ["string", "null"],
      description: "Exact sentence or fragment from the page that states the deadline. Null if none appears — never paraphrase or invent.",
    },
    eligibility: { type: ["string", "null"], description: "Who can apply (discipline, career stage, age, geography)." },
    award: { type: ["string", "null"], description: "Award amount, stipend, or what recipients get." },
    location: { type: ["string", "null"], description: "Where the opportunity takes place, or remote/worldwide." },
    application_url: { type: ["string", "null"], description: "Direct application or guidelines URL if one appears on the page." },
  },
};

async function distillPage(url, content) {
  const response = await getOpenAI().responses.create({
    model: EXTRACT_MODEL,
    reasoning: { effort: "minimal" },
    input: [
      {
        role: "system",
        content:
          "You extract facts about artist opportunities (grants, residencies, open calls, fellowships, commissions, exhibitions, competitions) from web page content. Report only what the page states. For deadline_quote, copy the exact text from the page; if the page states no deadline, return null for both deadline fields.",
      },
      {
        role: "user",
        content: `URL: ${url}\n\nPage content:\n${content.slice(0, MAX_DISTILL_INPUT_CHARS)}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "page_facts",
        strict: true,
        schema: PAGE_FACTS_SCHEMA,
      },
    },
  });

  return JSON.parse(response.output_text);
}

function profileSearchContext(profile) {
  if (!profile) return "";

  const parts = [
    cleanText(profile.discipline, 120),
    cleanText(profile.bio, 220),
  ].filter(Boolean);

  return parts.length ? parts.join(" ") : "";
}

function formatResult(result) {
  return {
    title: cleanText(result?.title, 180) || "Untitled result",
    url: result?.url || null,
    content: cleanText(result?.content, 700),
    score: typeof result?.score === "number" ? result.score : null,
    favicon: result?.favicon || null,
  };
}

async function tavilyRequest(url, body, timeoutMs = 30000) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Project-ID": "coda-mvp",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.error || payload?.message || `Tavily request failed with status ${response.status}.`;
      throw new Error(message);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export function createWebSearchTools({ artistProfile = null } = {}) {
  return [
    tool({
      name: "web_search",
      description: "Search the live web with Tavily for current information, especially artist opportunities such as grants, residencies, open calls, commissions, competitions, fellowships, and exhibitions. Use this whenever the user asks to search, find, discover, research, look up, or check current web information. IMPORTANT: result snippets are partial page excerpts and often omit deadlines and other key details — treat them as leads only. Before reporting or queuing details like deadline, eligibility, or award amount, call web_extract on the promising URLs. Return source URLs and do not create tracked opportunities unless the user asks to add them.",
      parameters: z.object({
        query: z.string().describe("Search query for the opportunity search. Include discipline, opportunity type, location, deadline timing, or other relevant constraints."),
        max_results: z.number().int().min(1).max(10).nullable().describe("Maximum number of results to return. Defaults to 5."),
        location: z.string().nullable().describe("Optional geographic focus, such as city, country, region, remote, or worldwide."),
        opportunity_type: z.string().nullable().describe("Optional type, such as grant, residency, open call, fellowship, commission, exhibition, or competition."),
      }),
      async execute({ query, max_results, location, opportunity_type }) {
        const profileContext = profileSearchContext(artistProfile);
        const queryParts = [
          query,
          opportunity_type ? `type: ${opportunity_type}` : null,
          location ? `location: ${location}` : null,
          profileContext ? `artist context: ${profileContext}` : null,
        ].filter(Boolean);

        const payload = await tavilyRequest(TAVILY_SEARCH_URL, {
          query: queryParts.join(" "),
          search_depth: "basic",
          topic: "general",
          max_results: max_results || 5,
          include_answer: false,
          include_raw_content: false,
          include_images: false,
          include_favicon: true,
          include_usage: true,
          safe_search: true,
        }, 15000);

        return {
          query: payload?.query || queryParts.join(" "),
          results: Array.isArray(payload?.results) ? payload.results.map(formatResult) : [],
          response_time: payload?.response_time || null,
          usage: payload?.usage || null,
        };
      },
    }),

    tool({
      name: "web_extract",
      description: "Fetch one or more URLs with Tavily Extract and distill each page into structured opportunity facts: title, summary, deadline, deadline_quote (the exact deadline text from the page), eligibility, award, location, and application_url, plus a short content excerpt. Use this after web_search before reporting or queuing opportunity details: search snippets often omit deadlines, eligibility, award amounts, and locations. Trust the facts fields over the excerpt. If facts.deadline is null, report the deadline as unknown — never assume there is no deadline. If distillation fails for a page, the result contains raw cleaned content instead; read it directly.",
      parameters: z.object({
        urls: z.array(z.string()).min(1).max(5).describe("URLs to extract full page content from (up to 5 per call)."),
      }),
      async execute({ urls }) {
        const payload = await tavilyRequest(TAVILY_EXTRACT_URL, {
          urls,
          extract_depth: "basic",
          format: "markdown",
          include_usage: true,
        }, 30000);

        const extracted = Array.isArray(payload?.results) ? payload.results : [];

        const results = await Promise.all(
          extracted.map(async (result) => {
            const url = result?.url || null;
            const content = cleanMarkdown(result?.raw_content);

            try {
              const facts = await distillPage(url, content);
              return { url, facts, excerpt: content.slice(0, EXCERPT_CHARS) };
            } catch (error) {
              console.warn("web_extract distillation failed", url, error?.message);
              return {
                url,
                facts: null,
                content: content.slice(0, FALLBACK_CONTENT_CHARS),
                distill_error: "Could not distill this page; raw content included instead.",
              };
            }
          })
        );

        const failed = Array.isArray(payload?.failed_results)
          ? payload.failed_results.map((result) => ({
              url: result?.url || null,
              error: cleanText(result?.error, 200) || "Extraction failed.",
            }))
          : [];

        return { results, failed, usage: payload?.usage || null };
      },
    }),
  ];
}
