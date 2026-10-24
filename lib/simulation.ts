/**
 * Demo calling simulation: deterministic per-phone scenarios so the live
 * view, summaries and results feel real without any telephony connected.
 * When ElevenLabs is configured, /api/calls/start returns mode:"live" and
 * real conversation data replaces these scripts.
 */

import type { AgentSlug } from "./data";

export type CallStatus =
  | "Pending"
  | "Calling"
  | "Completed"
  | "No Answer"
  | "Busy"
  | "Failed";

export interface CallResult {
  phone: string;
  status: CallStatus;
  durationSec: number;
  outcome: string | null;
  summary: string | null;
  transcript: string[];
}

export interface Scenario {
  status: CallStatus;
  outcome: string;
  durationSec: number;
  summary: string;
  transcript: string[];
}

const DISPATCHER_SCENARIOS: Scenario[] = [
  {
    status: "Completed",
    outcome: "Load Booked",
    durationSec: 132,
    summary:
      "Driver is in Dallas, TX with an empty Dry Van. Accepted the Dallas → Atlanta load at $2,850 for tomorrow 8:00 AM pickup. Truck and trailer number confirmed — rate confirmation will be sent to his email.",
    transcript: [
      "AI: Hello, this is Alex calling from SwiftLine Dispatch. I'm calling about a load we have available. Do you have a moment?",
      "Driver: Yeah, go ahead. I'm empty in Dallas right now.",
      "AI: Perfect. We have a Dry Van load, Dallas to Atlanta, pickup tomorrow 8:00 AM, 38,000 lbs, 940 miles at $2,850. Does that work for you?",
      "Driver: $2,850 works. Send me the rate confirmation.",
      "AI: Done. Can I confirm your truck and trailer number for the booking?",
      "Driver: Truck 214, trailer 53-foot Dry Van, number 7781.",
      "AI: Booked. The rate confirmation is on its way to your email. Thank you!",
    ],
  },
  {
    status: "Completed",
    outcome: "Rate Too Low",
    durationSec: 96,
    summary:
      "Driver heard the full offer but declined the rate for the Chicago → Dallas lane — he needs at least $2,900 to run it. Asked for a callback if the rate increases.",
    transcript: [
      "AI: Hello, this is Alex calling from SwiftLine Dispatch about an available load. Do you have a moment?",
      "Driver: Sure, what have you got?",
      "AI: Chicago to Dallas, Dry Van, pickup Friday, 1,290 miles at $2,450.",
      "Driver: That's too low for that lane. I'd need at least $2,900.",
      "AI: Understood — that's above the range I can offer today. May I call you back if the rate goes up?",
      "Driver: Yeah, call me if it moves.",
    ],
  },
  {
    status: "Completed",
    outcome: "Not Available",
    durationSec: 61,
    summary:
      "Driver is under a load until Thursday and cannot take new work. He will be empty in Fort Worth on Friday morning and asked to be called then.",
    transcript: [
      "AI: Hello, this is Alex from SwiftLine Dispatch, calling about a load we have available.",
      "Driver: I'm under a load right now, delivering Thursday.",
      "AI: No problem. When will you be available next?",
      "Driver: Empty Friday morning in Fort Worth. Call me then.",
      "AI: Noted — we'll call you Friday morning. Drive safe!",
    ],
  },
  {
    status: "Completed",
    outcome: "Interested — Callback",
    durationSec: 84,
    summary:
      "Driver is interested in the load but is driving and cannot talk safely right now. Requested a callback in about 2 hours to confirm the details.",
    transcript: [
      "AI: Hello, this is Alex from SwiftLine Dispatch about an available load.",
      "Driver: I'm driving right now, can't really talk.",
      "AI: Of course — when is a good time to call back?",
      "Driver: Give me two hours, I'll be stopped by then.",
      "AI: Perfect, we'll call you back in two hours with the full details.",
    ],
  },
  {
    status: "No Answer",
    outcome: "No Answer",
    durationSec: 0,
    summary:
      "No answer after several rings and no voicemail was left. Per campaign rules this number will be retried once.",
    transcript: ["AI: Dialling…", "System: Ringing… no answer."],
  },
  {
    status: "Failed",
    outcome: "Wrong Number",
    durationSec: 18,
    summary:
      "The number belongs to a restaurant, not a driver. Marked as Wrong Number — it will not be called again from this list.",
    transcript: [
      "AI: Hello, this is Alex from SwiftLine Dispatch, calling about a load…",
      "Person: Sorry, this is a restaurant — you have the wrong number.",
      "AI: My apologies, we'll remove this number. Thank you.",
    ],
  },
];

const BRAND_SCENARIOS: Scenario[] = [
  {
    status: "Completed",
    outcome: "Application Details Received",
    durationSec: 154,
    summary:
      "Spoke with the wholesale team. They accept new Amazon/Walmart resellers: send the business licence and resale certificate to their approvals email. Opening order MOQ is $1,500 and their MAP policy applies. Application link and full requirements were shared on the call.",
    transcript: [
      "AI: Hello, this is Sarah calling on behalf of BrightCart LLC. We sell on Amazon, Walmart and eBay, and we'd like to become an authorised reseller for your brand. Could I speak with your wholesale team?",
      "Brand: That's me — go ahead.",
      "AI: Great. Do you accept new online resellers, and what do you require?",
      "Brand: Yes. Send us your business licence and resale certificate. Opening order is $1,500 minimum, and we have a MAP policy.",
      "AI: Perfect. Where should we send the application?",
      "Brand: Email everything to our wholesale approvals inbox — I'll spell it out for you…",
      "AI: Got it, letter by letter. We'll send our business profile and documents today. Thank you!",
    ],
  },
  {
    status: "Completed",
    outcome: "Documents Required",
    durationSec: 121,
    summary:
      "Brand is open to the application but first needs documents: business licence, resale certificate and a storefront link. They will review within 5 business days once received.",
    transcript: [
      "AI: Hello, this is Sarah calling on behalf of BrightCart LLC about becoming an authorised reseller.",
      "Brand: We can look at it. We'd need your business licence, resale certificate and a link to your storefront first.",
      "AI: We have all three ready. Where should we send them?",
      "Brand: Send them to our office email and we'll review within five business days.",
      "AI: Confirmed. We'll send the documents today — thank you for your time.",
    ],
  },
  {
    status: "Completed",
    outcome: "Callback Scheduled",
    durationSec: 88,
    summary:
      "The approvals manager was in a meeting. The gatekeeper took our details and scheduled a callback for tomorrow at 11:00 AM with the wholesale manager.",
    transcript: [
      "AI: Hello, this is Sarah calling on behalf of BrightCart LLC. Could I speak with your reseller approvals team?",
      "Reception: The manager is in a meeting right now.",
      "AI: No problem — could we schedule a short callback?",
      "Reception: Tomorrow at 11 works. I'll put it in his calendar.",
      "AI: Perfect, we'll be ready. Thank you!",
    ],
  },
  {
    status: "Completed",
    outcome: "Not Accepting Resellers",
    durationSec: 73,
    summary:
      "Brand confirmed they are not onboarding any new resellers at this time. Suggested checking back next quarter.",
    transcript: [
      "AI: Hello, this is Sarah calling on behalf of BrightCart LLC about your reseller program.",
      "Brand: We're not taking on new resellers at the moment, sorry.",
      "AI: Understood. When would be a good time to check back?",
      "Brand: Try again next quarter.",
      "AI: Thank you — we'll follow up then.",
    ],
  },
  {
    status: "No Answer",
    outcome: "No Answer",
    durationSec: 0,
    summary:
      "No answer after several rings. Per campaign rules this number will be retried once during business hours.",
    transcript: ["AI: Dialling…", "System: Ringing… no answer."],
  },
  {
    status: "Completed",
    outcome: "Marketplace Not Allowed",
    durationSec: 97,
    summary:
      "Brand sells through its own website only and does not permit Amazon/Walmart/eBay listings. Do not pursue this brand for marketplace approval.",
    transcript: [
      "AI: Hello, this is Sarah calling on behalf of BrightCart LLC. We'd like to sell your products on Amazon and Walmart.",
      "Brand: We don't allow marketplace sales — we sell only through our own website.",
      "AI: Understood, thank you for clarifying. We'll note that down.",
    ],
  },
];

export function scenariosFor(slug: AgentSlug): Scenario[] {
  return slug === "truck-dispatcher" ? DISPATCHER_SCENARIOS : BRAND_SCENARIOS;
}

/** Deterministic scenario per phone number (same number → same demo result). */
export function scenarioFor(slug: AgentSlug, phone: string): Scenario {
  const scenarios = scenariosFor(slug);
  const hash = phone
    .replace(/\D/g, "")
    .split("")
    .reduce((acc, ch) => acc + Number(ch), 0);
  return scenarios[hash % scenarios.length];
}

/** Sample completed campaign used to pre-fill the demo dashboard/results. */
export const SAMPLE_CAMPAIGN = {
  name: "Texas Drivers — Load Board (sample)",
  agentSlug: "truck-dispatcher" as AgentSlug,
  createdAt: "2026-10-22",
};

export const SAMPLE_RESULTS: CallResult[] = [
  "+12145550134",
  "+13125550198",
  "+17035550127",
  "+14065550163",
  "+12135550141",
  "+19175550172",
  "+18325550109",
  "+16175550155",
].map((phone) => {
  const s = scenarioFor("truck-dispatcher", phone);
  return {
    phone,
    status: s.status,
    durationSec: s.durationSec,
    outcome: s.outcome,
    summary: s.summary,
    transcript: s.transcript,
  };
});
