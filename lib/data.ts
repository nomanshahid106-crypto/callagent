/**
 * Product data: the two launch agents and the subscription plans.
 * Source of truth: TWO_AGENTS_SPEC.md and SUBSCRIPTION_STRUCTURE.md
 * (~/workspace/ai-outbound-call-platform/).
 */

export type AgentSlug = "truck-dispatcher" | "brand-approval";

export interface AgentDef {
  slug: AgentSlug;
  name: string;
  shortName: string;
  tagline: string;
  icon: string;
  callsWho: string;
  purpose: string;
  firstMessage: string;
  callFlow: string[];
  dataCollected: string[];
  outcomes: string[];
  /** Outcome counted as the "headline" success in results totals. */
  headlineOutcome: string;
  voiceDefault: string;
}

export const AGENTS: AgentDef[] = [
  {
    slug: "truck-dispatcher",
    name: "Truck Dispatcher Agent",
    shortName: "Truck Dispatcher",
    tagline: "Calls your drivers, offers loads, and books the ones who accept.",
    icon: "🚛",
    callsWho: "Truck drivers, owner-operators and carriers from your list.",
    purpose:
      "Checks each driver's location, equipment and availability, offers them your load, negotiates only inside your rate range, and confirms bookings.",
    firstMessage:
      "Hello, this is Alex calling from your dispatch company. I'm calling about a load we have available. Do you have a moment to hear the details?",
    callFlow: [
      "Greets and introduces your dispatch company",
      "Confirms the driver's location, equipment (Dry Van / Reefer / Flatbed) and availability",
      "Offers the load: lane, pickup/delivery times, weight, miles and rate",
      "Negotiates only inside your configured rate range — never above your max",
      "On acceptance: confirms truck/trailer number and email for the rate confirmation",
    ],
    dataCollected: [
      "Driver name",
      "Location",
      "Equipment",
      "Availability",
      "Accepted yes/no",
      "Agreed rate",
      "Truck / trailer number",
      "Email for rate confirmation",
      "Next availability",
    ],
    outcomes: [
      "Load Booked",
      "Interested — Callback",
      "Not Available",
      "Rate Too Low",
      "No Answer",
      "Wrong Number",
      "Do Not Call",
    ],
    headlineOutcome: "Load Booked",
    voiceDefault: "Professional US English voice",
  },
  {
    slug: "brand-approval",
    name: "E-commerce Brand Approval Agent",
    shortName: "Brand Approval",
    tagline:
      "Calls brands for you and gets your reseller approval process started.",
    icon: "🛍️",
    callsWho: "Brands, manufacturers and authorised distributors from your list.",
    purpose:
      "Reaches the wholesale / reseller-approvals team, asks the brand's requirements (licence, resale certificate, MOQ, MAP policy), and collects the exact application process and email — so your Amazon / Walmart / eBay approval can start.",
    firstMessage:
      "Hello, this is Sarah calling on behalf of your business. We sell on Amazon, Walmart and eBay, and we're interested in becoming an authorised reseller for your brand. Could I speak with your wholesale or reseller approvals team, please?",
    callFlow: [
      "Introduces your business: marketplaces, years selling, monthly volume",
      "Asks for the wholesale / reseller approvals team (handles gatekeepers politely)",
      "Asks requirements: licence, resale certificate, MOQ, MAP policy",
      "Collects the application process, approvals email and timeline",
      "Offers to send your business profile and documents by email",
    ],
    dataCollected: [
      "Brand name",
      "Contact person + title",
      "Approvals email",
      "Requirements list",
      "MOQ",
      "MAP / restrictions",
      "Application link / email",
      "Timeline",
      "Follow-up date",
    ],
    outcomes: [
      "Approved",
      "Application Details Received",
      "Documents Required",
      "Not Accepting Resellers",
      "Marketplace Not Allowed",
      "Callback Scheduled",
      "No Answer",
      "Wrong Number",
      "Do Not Call",
    ],
    headlineOutcome: "Application Details Received",
    voiceDefault: "Professional, polite business English voice",
  },
];

export function getAgent(slug: string): AgentDef | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

export interface PlanDef {
  id: "starter" | "growth" | "business";
  name: string;
  priceMonthly: number;
  includedMinutes: number;
  overageRate: number; // USD per minute from the wallet
  contactsPerCampaign: number;
  features: string[];
}

export const PLANS: PlanDef[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 39,
    includedMinutes: 150,
    overageRate: 0.35,
    contactsPerCampaign: 500,
    features: [
      "150 calling minutes / month",
      "1 agent subscription",
      "Up to 500 numbers per campaign",
      "Call summary + results list",
      "Transcripts included",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 99,
    includedMinutes: 400,
    overageRate: 0.3,
    contactsPerCampaign: 2000,
    features: [
      "400 calling minutes / month",
      "1 agent subscription",
      "Up to 2,000 numbers per campaign",
      "Call summary + results list",
      "Auto-retry on no-answer (1×)",
      "Transcripts + recordings",
    ],
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 249,
    includedMinutes: 1100,
    overageRate: 0.25,
    contactsPerCampaign: 10000,
    features: [
      "1,100 calling minutes / month",
      "1 agent subscription",
      "Up to 10,000 numbers per campaign",
      "Custom outcomes + summaries",
      "Auto-retry (up to 3×)",
      "Priority support",
    ],
  },
];

export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

/** The 4 final workflow steps (user-confirmed wording). */
export const WORKFLOW_STEPS = [
  { n: 1, title: "Choose Your Agent", text: "Pick the AI call agent you want — Truck Dispatcher or Brand Approval." },
  { n: 2, title: "Create Account & Pay Subscription", text: "Create your account and pay the subscription for that agent." },
  { n: 3, title: "Login To Your Account", text: "Login with the account you just created." },
  { n: 4, title: "Use Your Agent", text: "Paste your phone numbers, press Start Calling — the AI calls, summarises, and gives you the results list." },
];
