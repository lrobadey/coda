import { NextResponse } from "next/server";
import { run } from "@openai/agents";
import { createClient } from "../../../utils/supabase/server";
import { createCodaAgent } from "../../../lib/agent/codaAgent";
import { listOpportunities } from "../../../lib/opportunities";

export const maxDuration = 60;

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

    const agent = createCodaAgent({ supabase, userId: user.id });
    const input = [
      ...history,
      { role: "user", content: message },
    ];

    const result = await run(agent, input, {
      maxTurns: 8,
      tracing: true,
    });

    const opportunities = await listOpportunities(supabase);

    return NextResponse.json({
      output: result.finalOutput || "Done.",
      history: result.history,
      lastResponseId: result.lastResponseId,
      opportunities,
    });
  } catch (error) {
    console.error("Assistant route error", error);
    return NextResponse.json(
      { error: error?.message || "Assistant failed." },
      { status: 500 }
    );
  }
}
