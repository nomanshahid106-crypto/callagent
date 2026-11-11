import { NextResponse } from "next/server";
import { provisionNumber } from "@/lib/integrations/twilio";
import { getAgent, getPlan, type AgentSlug } from "@/lib/data";

/**
 * POST /api/provision — provisioning on subscription activation (Step 3b).
 *
 * Called by the client the moment a subscription becomes active. Server
 * route on purpose: Twilio credentials are read here, on the server, and
 * never reach the browser. Buys/assigns the customer's caller number and
 * allocates his plan's specific minutes. When Twilio env vars are missing
 * the number is a clearly-labelled demo number ({ mode: "demo" }).
 *
 * Body: { email: string, planId: string, agentSlug?: string,
 *         country?: string }
 * Returns: { mode, callerNumber, minutesAllocated, planId }
 */
export async function POST(req: Request) {
  let body: {
    email?: string;
    planId?: string;
    agentSlug?: string;
    country?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { mode: "error", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim();
  const plan = body.planId ? getPlan(body.planId) : undefined;
  const agentSlug = body.agentSlug as AgentSlug | undefined;

  if (!email.includes("@")) {
    return NextResponse.json(
      { mode: "error", message: "A valid account email is required." },
      { status: 400 },
    );
  }
  if (!plan) {
    return NextResponse.json(
      { mode: "error", message: "Unknown planId." },
      { status: 400 },
    );
  }
  if (agentSlug && !getAgent(agentSlug)) {
    return NextResponse.json(
      { mode: "error", message: "Unknown agentSlug." },
      { status: 400 },
    );
  }

  const result = await provisionNumber({ email, country: body.country });

  if (result.mode === "error") {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json({
    ...result,
    minutesAllocated: plan.includedMinutes,
    planId: plan.id,
  });
}
