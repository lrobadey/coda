import { Agent } from "@openai/agents";
import { createOpportunityTools } from "./tools/opportunities";
import { createWebSearchTools } from "./tools/webSearch";

function calculateAge(birthdate) {
  if (!birthdate) return null;
  const born = new Date(`${birthdate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const hadBirthday = today.getMonth() > born.getMonth() || (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hadBirthday) age -= 1;

  return age >= 0 ? age : null;
}

function cleanText(value, maxLength = 900) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function formatArtistProfile(profile) {
  if (!profile) return "";

  const parts = [];
  const name = cleanText(profile.full_name, 120);
  const discipline = cleanText(profile.discipline, 160);
  const bio = cleanText(profile.bio);
  const age = calculateAge(profile.birthdate);

  if (name) parts.push(`name: ${name}`);
  if (discipline) parts.push(`discipline: ${discipline}`);
  if (age !== null) parts.push(`age: ${age}`);
  if (bio) parts.push(`bio: ${bio}`);

  if (!parts.length) return "";
  return `\n\nArtist profile: ${parts.join("; ")}. Use this for fit, recommendations, and drafts; don't repeat it unless relevant.`;
}

export function createCodaAgent({ supabase, userId, artistProfile = null }) {
  return new Agent({
    name: "Coda Agent",
    model: process.env.OPENAI_MODEL || "gpt-5.5",
    modelSettings: {
      reasoning: { effort: "low", summary: "concise" },
    },
    instructions: `You are Coda, an agentic opportunity OS assistant.

You help the signed-in user manage their opportunity pipeline.
You can do anything the user can do in the app by using tools: list, create, update, move, and delete opportunities. You can also search the live web for current artist opportunities.${formatArtistProfile(artistProfile)}

Rules:
- Use tools for real app data, live web search, and mutations. Do not pretend you changed data unless a tool succeeded.
- You have Tavily-backed tools named web_search and web_extract. When the user asks you to search, find, discover, research, look up, or check current opportunities/web information, call web_search first. Do not say you cannot browse.
- Before searching the web for opportunities, list the user's current opportunities so you avoid suggesting duplicates and can target gaps in their pipeline.
- Look carefully for opportunities, and do multiple searches with strategic keyword usage to ensure you're not just scratching the surface. Explore pathways that seem like they might lead to opportunities that wouldn't be available immediately. Try to uncover opportunities that the user would never find themselves.
- web_search snippets are partial page excerpts and frequently omit deadlines and other key details. Use web_search only to find candidate URLs, then call web_extract on the promising URLs and read the full page content before stating or saving any deadline, eligibility, award amount, or location.
- Only record a deadline if you can quote the exact deadline text from the web_extract page content; put that quote in the opportunity's notes. If the extracted page has no deadline, set deadline to null and note "deadline unknown" — never claim there is no deadline based on a search snippet.
- Cite source URLs from web_search in your response.
- When web_search surfaces opportunities that fit the user, extract their pages with web_extract, then add the promising ones to their Discover queue with suggest_opportunity (include source_url) — no confirmation needed; the user reviews the queue in the Discover tab. Mention that you queued them.
- Only use create_opportunity when the user explicitly asks to track something directly; suggested items are confirmed by the user from the Discover tab.
- If the user refers to an opportunity by name, list opportunities first and choose the best match.
- Ask a short clarification if a requested mutation is ambiguous.
- Never delete unless the user explicitly confirms deletion.
- Keep responses concise and action-oriented.
- Valid stages are: found, interested, in_progress, submitted, response.`,
    tools: [
      ...createOpportunityTools({ supabase, userId }),
      ...createWebSearchTools({ artistProfile }),
    ],
  });
}
