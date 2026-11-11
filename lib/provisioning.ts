/**
 * Provisioning view helper (Step 3b — owner's workflow, 2026-11-11).
 *
 * Every subscriber gets a dedicated caller number + his plan's specific
 * minutes allocated at subscription time. This resolves what the UI should
 * show for the current demo state: the provisioned values when a real
 * subscription exists, otherwise the deterministic demo number / the
 * default plan's minutes, so demo screens are always consistent.
 */

import { getPlan } from "./data";
import { demoCallerNumber } from "./phone";

export interface ProvisioningView {
  callerNumber: string;
  minutesAllocated: number;
  /** True unless a real Twilio number was provisioned (mode "live"). */
  isDemoNumber: boolean;
}

export function provisioningView(input: {
  callerNumber?: string;
  minutesAllocated?: number;
  provisioningMode?: "demo" | "live";
  planId?: string;
  email?: string | null;
}): ProvisioningView {
  const plan = input.planId ? getPlan(input.planId) : undefined;
  return {
    callerNumber:
      input.callerNumber ?? demoCallerNumber(input.email ?? "demo@callagent.app"),
    minutesAllocated: input.minutesAllocated ?? plan?.includedMinutes ?? 400,
    isDemoNumber: input.provisioningMode !== "live",
  };
}
