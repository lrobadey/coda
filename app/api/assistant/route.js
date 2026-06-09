import { NextResponse } from "next/server";
import { run } from "@openai/agents";
import { createClient } from "../../../utils/supabase/server";
import { createCodaAgent } from "../../../lib/agent/codaAgent";
import { listOpportunities } from "../../../lib/opportunities";

export const maxDuration = 60;

const STAGE_LABELS = {
  found: "Saved",
  interested: "Interested",
  in_progress: "Ongoing",
  submitted: "Submitted",
  response: "Decision made",
};

const TOOL_META = {
  list_opportunities: {
    label: "Search tracker",
    icon: "search",
    started: "Reading your pipeline…",
    completed: "Reviewed your pipeline.",
  },
  create_opportunity: {
    label: "Create opportunity",
    icon: "plus",
    started: "Adding an opportunity…",
    completed: "Opportunity added.",
  },
  suggest_opportunity: {
    label: "Suggest opportunity",
    icon: "compass",
    started: "Queuing a suggestion…",
    completed: "Added to your Discover queue.",
  },
  update_opportunity: {
    label: "Update opportunity",
    icon: "doc",
    started: "Updating details…",
    completed: "Opportunity updated.",
  },
  move_opportunity: {
    label: "Move stage",
    icon: "board",
    started: "Moving across the pipeline…",
    completed: "Pipeline updated.",
  },
  delete_opportunity: {
    label: "Delete opportunity",
    icon: "trash",
    started: "Deleting opportunity…",
    completed: "Opportunity deleted.",
  },
  web_search: {
    label: "Web search",
    icon: "search",
    started: "Searching the web…",
    completed: "Search complete.",
  },
};

function parseMaybeJson(value) {
  if (!value || typeof value !== "string") return value ?? null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatStage(stage) {
  return STAGE_LABELS[stage] || stage || "Unknown stage";
}

function formatToolAction(name, args = {}) {
  if (name === "list_opportunities") return "Scanning tracked opportunities";

  if (name === "create_opportunity") {
    return `Creating “${args.title || "Untitled opportunity"}”${args.org ? ` at ${args.org}` : ""}`;
  }

  if (name === "suggest_opportunity") {
    return `Suggesting “${args.title || "Untitled opportunity"}”${args.org ? ` at ${args.org}` : ""}`;
  }

  if (name === "update_opportunity") {
    const fields = [
      args.title ? "title" : null,
      args.org ? "organization" : null,
      args.deadline ? "deadline" : null,
      args.stage ? "stage" : null,
      args.source_url ? "source" : null,
      args.notes ? "notes" : null,
    ].filter(Boolean);
    return fields.length ? `Updating ${fields.join(", ")}` : "Updating opportunity details";
  }

  if (name === "move_opportunity") return `Moving to ${formatStage(args.stage)}`;

  if (name === "delete_opportunity") {
    return args.confirmed ? "Deleting a confirmed opportunity" : "Checking delete confirmation";
  }

  if (name === "web_search") {
    return `Searching for ${args.opportunity_type || "artist opportunities"}${args.location ? ` in ${args.location}` : ""}`;
  }

  return "Using Coda tool";
}

function formatToolResult(name, output) {
  if (name === "list_opportunities" && Array.isArray(output)) {
    return `Found ${output.length} tracked ${output.length === 1 ? "opportunity" : "opportunities"}`;
  }

  if (name === "create_opportunity" && output?.title) return `Created “${output.title}”`;
  if (name === "suggest_opportunity") {
    if (output?.duplicate) return output.message || "Already suggested or tracked";
    if (output?.title) return `Queued “${output.title}” for review`;
  }
  if (name === "update_opportunity" && output?.title) return `Updated “${output.title}”`;
  if (name === "move_opportunity" && output?.title) return `Moved “${output.title}” to ${formatStage(output.stage)}`;
  if (name === "delete_opportunity" && output?.deleted) return "Deleted the opportunity";
  if (name === "web_search" && Array.isArray(output?.results)) {
    return `Found ${output.results.length} web ${output.results.length === 1 ? "result" : "results"}`;
  }
  if (output?.needs_confirmation) return "Waiting for your confirmation";

  return TOOL_META[name]?.completed || "Tool finished";
}

function getTextDelta(event) {
  if (!event || typeof event !== "object") return "";
  if (event.type === "output_text_delta" && typeof event.delta === "string") return event.delta;
  if (event.type === "response.output_text.delta" && typeof event.delta === "string") return event.delta;
  return "";
}

function getReasoningSummaryDelta(event) {
  if (!event || typeof event !== "object") return "";
  const data = event.event || event;
  if (data.type === "response.reasoning_summary_text.delta" && typeof data.delta === "string") {
    return data.delta;
  }
  return "";
}

function getReasoningSummaryDone(event) {
  if (!event || typeof event !== "object") return "";
  const data = event.event || event;
  if (data.type === "response.reasoning_summary_text.done" && typeof data.text === "string") {
    return data.text;
  }
  return "";
}

function getRawToolItem(event) {
  return event?.item?.rawItem || event?.item || {};
}

function getToolName(event) {
  return getRawToolItem(event).name || event?.item?.name || "tool";
}

function getToolId(event) {
  const raw = getRawToolItem(event);
  return raw.callId || raw.call_id || raw.id || `${getToolName(event)}-${event.name}`;
}

function getToolStatus(event) {
  if (event?.type !== "run_item_stream_event") return null;

  const name = getToolName(event);
  const meta = TOOL_META[name] || { label: "Coda tool", icon: "sparkle" };
  const raw = getRawToolItem(event);
  const id = getToolId(event);

  if (event.name === "tool_called") {
    const args = parseMaybeJson(raw.arguments) || {};
    return {
      type: "tool",
      id,
      name,
      label: meta.label,
      icon: meta.icon,
      status: "started",
      message: meta.started || "Using a tool…",
      action: formatToolAction(name, args),
    };
  }

  if (event.name === "tool_output") {
    const output = parseMaybeJson(raw.output);
    return {
      type: "tool",
      id,
      name,
      label: meta.label,
      icon: meta.icon,
      status: output?.needs_confirmation ? "waiting" : "completed",
      message: output?.needs_confirmation ? "Waiting for confirmation." : meta.completed || "Tool finished.",
      result: formatToolResult(name, output),
    };
  }

  return null;
}

export async function POST(request) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: artistProfile, error: profileError } = await supabase
      .from("artist_profiles")
      .select("full_name,discipline,birthdate,bio")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn("Could not load artist profile for assistant", profileError.message);
    }

    const agent = createCodaAgent({ supabase, userId: user.id, artistProfile: artistProfile || null });
    const input = [
      ...history,
      { role: "user", content: message },
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };

        try {
          send({ type: "status", message: "Coda is thinking…" });

          const result = await run(agent, input, {
            stream: true,
            maxTurns: 12,
            tracing: true,
            signal: request.signal,
          });

          for await (const event of result) {
            if (event.type === "raw_model_stream_event") {
              const delta = getTextDelta(event.data);
              if (delta) send({ type: "delta", text: delta });

              const reasoningDelta = getReasoningSummaryDelta(event.data);
              if (reasoningDelta) send({ type: "reasoning_delta", text: reasoningDelta });

              const reasoningDone = getReasoningSummaryDone(event.data);
              if (reasoningDone) send({ type: "reasoning_done", text: reasoningDone });

              continue;
            }

            const toolStatus = getToolStatus(event);
            if (toolStatus) send(toolStatus);
          }

          await result.completed;

          const opportunities = await listOpportunities(supabase);

          send({
            type: "final",
            output: result.finalOutput || "Done.",
            history: result.history,
            lastResponseId: result.lastResponseId,
            opportunities,
          });
        } catch (error) {
          console.error("Assistant stream error", error);
          send({ type: "error", error: error?.message || "Assistant failed." });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Assistant route error", error);
    return NextResponse.json(
      { error: error?.message || "Assistant failed." },
      { status: 500 }
    );
  }
}
