import { tool } from "@openai/agents";
import { z } from "zod";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

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

export function createWebSearchTools({ artistProfile = null } = {}) {
  return [
    tool({
      name: "find_artist_opportunities",
      description: "Search the live web for current artist opportunities such as grants, residencies, open calls, commissions, competitions, fellowships, and exhibitions. Use this for finding new opportunities or checking current web information. Return source URLs and do not create tracked opportunities unless the user asks to add them.",
      parameters: z.object({
        query: z.string().describe("Search query for the opportunity search. Include discipline, opportunity type, location, deadline timing, or other relevant constraints."),
        max_results: z.number().int().min(1).max(10).nullable().describe("Maximum number of results to return. Defaults to 5."),
        location: z.string().nullable().describe("Optional geographic focus, such as city, country, region, remote, or worldwide."),
        opportunity_type: z.string().nullable().describe("Optional type, such as grant, residency, open call, fellowship, commission, exhibition, or competition."),
      }),
      async execute({ query, max_results, location, opportunity_type }) {
        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
          throw new Error("TAVILY_API_KEY is not configured.");
        }

        const profileContext = profileSearchContext(artistProfile);
        const queryParts = [
          query,
          opportunity_type ? `type: ${opportunity_type}` : null,
          location ? `location: ${location}` : null,
          profileContext ? `artist context: ${profileContext}` : null,
        ].filter(Boolean);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        try {
          const response = await fetch(TAVILY_SEARCH_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "X-Project-ID": "coda-mvp",
            },
            body: JSON.stringify({
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
            }),
            signal: controller.signal,
          });

          const payload = await response.json().catch(() => null);

          if (!response.ok) {
            const message = payload?.error || payload?.message || `Tavily search failed with status ${response.status}.`;
            throw new Error(message);
          }

          return {
            query: payload?.query || queryParts.join(" "),
            results: Array.isArray(payload?.results) ? payload.results.map(formatResult) : [],
            response_time: payload?.response_time || null,
            usage: payload?.usage || null,
          };
        } finally {
          clearTimeout(timeout);
        }
      },
    }),
  ];
}
