import { NextResponse } from "next/server";
import { startOutboundCall } from "@/lib/integrations/elevenlabs";
import { getAgent, type AgentSlug } from "@/lib/data";

/**
 * POST /api/calls/start — place ONE outbound call.
 *
 * Server route on purpose: the ElevenLabs API key is read here, on the
 * server, and never reaches the browser. When ElevenLabs env vars are
 * missing, returns { mode: "demo" } and the client runs its simulation.
 *
 * Body: { toNumber: string, agentSlug: "truck-dispatcher" | "brand-approval",
 *         dynamicVariables?: Record<string, string> }
 */
export async function POST(req: Request) {
  let body: {
    toNumber?: string;
    agentSlug?: string;
    dynamicVariables?: Record<string, string>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { mode: "error", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const toNumber = (body.toNumber ?? "").trim();
  const agentSlug = body.agentSlug as AgentSlug | undefined;

  if (!toNumber.startsWith("+") || toNumber.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      {
        mode: "error",
        message: "toNumber must be in international format, e.g. +15551234567.",
      },
      { status: 400 },
    );
  }
  if (!agentSlug || !getAgent(agentSlug)) {
    return NextResponse.json(
      { mode: "error", message: "Unknown agentSlug." },
      { status: 400 },
    );
  }

  const result = await startOutboundCall({
    agentSlug,
    toNumber,
    dynamicVariables: body.dynamicVariables,
  });

  if (result.mode === "error") {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
