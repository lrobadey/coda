import { tool } from "@openai/agents";
import { z } from "zod";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";
const TAVILY_EXTRACT_URL = "https://api.tavily.com/extract";

function cleanText(value, maxLength = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
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
      description: "Search the live web with Tavily for current information, especially artist opportunities such as grants, residencies, open calls, commissions, competitions, fellowships, and exhibitions. Use this whenever the user asks to search, find, discover, research, look up, or check current web information. IMPORTANT: result snippets are partial page excerpts and often omit deadlines and other key details — treat them as leads only. Before reporting or queuing details like deadline, eligibility, or award amount, call web_extract on the promising URLs and read the full page content. Return source URLs and do not create tracked opportunities unless the user asks to add them.",
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
      description: "Fetch the full page content of one or more URLs with Tavily Extract. Use this after web_search before reporting or queuing opportunity details: snippets often omit deadlines, eligibility, award amounts, and locations that appear on the actual page. Quote the exact deadline text from the extracted content; if no deadline appears in the full page, report the deadline as unknown — never assume there is no deadline.",
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

        const results = Array.isArray(payload?.results)
          ? payload.results.map((result) => ({
              url: result?.url || null,
              content: String(result?.raw_content || "").trim().slice(0, 4000),
            }))
          : [];

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
