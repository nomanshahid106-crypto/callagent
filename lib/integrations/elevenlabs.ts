/**
 * ElevenLabs integration — real outbound phone calls.
 *
 * SERVER ONLY: this module reads ELEVENLABS_API_KEY and must only be imported
 * from server code (the /api/calls/start route handler). API keys are never
 * exposed to the browser.
 *
 * The platform's Twilio number is imported into ElevenLabs once; its id is
 * ELEVENLABS_AGENT_PHONE_NUMBER_ID. Each agent created in ElevenLabs has its
 * own id (ELEVENLABS_AGENT_ID_DISPATCHER / ELEVENLABS_AGENT_ID_BRAND).
 */

import { serverConfig } from "../config";
import type { AgentSlug } from "../data";

export interface OutboundCallRequest {
  agentSlug: AgentSlug;
  toNumber: string; // E.164, e.g. +15551234567
  /** Per-call variables injected into the agent's prompt/first message. */
  dynamicVariables?: Record<string, string>;
}

export type OutboundCallResult =
  | { mode: "live"; conversationId: string; callSid: string | null }
  | { mode: "demo"; message: string }
  | { mode: "error"; message: string };

export function elevenLabsAgentId(slug: AgentSlug): string {
  const c = serverConfig();
  return slug === "truck-dispatcher"
    ? c.elevenlabsAgentIdDispatcher
    : c.elevenlabsAgentIdBrand;
}

export async function startOutboundCall(
  req: OutboundCallRequest,
): Promise<OutboundCallResult> {
  const c = serverConfig();
  const agentId = elevenLabsAgentId(req.agentSlug);

  if (!c.elevenlabsApiKey || !agentId || !c.elevenlabsAgentPhoneNumberId) {
    return {
      mode: "demo",
      message:
        "ElevenLabs is not configured (ELEVENLABS_API_KEY / agent id / phone number id missing) — the client should run the demo simulation.",
    };
  }

  try {
    const res = await fetch(
      "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": c.elevenlabsApiKey,
        },
        body: JSON.stringify({
          agent_id: agentId,
          agent_phone_number_id: c.elevenlabsAgentPhoneNumberId,
          to_number: req.toNumber,
          conversation_initiation_client_data: req.dynamicVariables
            ? { dynamic_variables: req.dynamicVariables }
            : undefined,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        mode: "error",
        message: `ElevenLabs outbound-call failed (${res.status}): ${text.slice(0, 300)}`,
      };
    }

    const data = (await res.json()) as {
      conversation_id?: string;
      callSid?: string;
    };
    return {
      mode: "live",
      conversationId: data.conversation_id ?? "",
      callSid: data.callSid ?? null,
    };
  } catch (err) {
    return {
      mode: "error",
      message: `ElevenLabs request error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
