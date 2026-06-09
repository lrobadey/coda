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
- Use web search when the user asks to find new/current opportunities or needs up-to-date information. Cite source URLs in your response.
- Do not create tracked opportunities from web search results unless the user explicitly asks you to add them.
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
