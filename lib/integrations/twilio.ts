/**
 * Twilio integration — phone-number provisioning (Step 3b).
 *
 * SERVER ONLY: this module reads TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN and
 * must only be imported from server code (the /api/provision route handler).
 * Credentials are never exposed to the browser.
 *
 * Owner's workflow (2026-11-11): the moment a subscription activates, the
 * system buys a phone number under the platform's master Twilio account and
 * assigns it to that customer, and allocates his plan's minutes. Every call
 * he makes is then established from his assigned number.
 *
 * When Twilio is not configured, provisionNumber() returns a clearly-demo
 * number (deterministic per account email, from the fictional 555-01XX
 * range) so the whole flow is demonstrable end-to-end in DEMO mode.
 */

import { serverConfig } from "../config";
import { demoCallerNumber } from "../phone";

export interface ProvisionNumberRequest {
  /** Account email — used only to derive the stable demo number. */
  email: string;
  /** Country to buy the number in (ISO 3166-1 alpha-2). Default "US". */
  country?: string;
}

export type ProvisionNumberResult =
  | {
      mode: "live";
      callerNumber: string; // E.164, e.g. +12125550134
      phoneSid: string;
    }
  | { mode: "demo"; callerNumber: string; message: string }
  | { mode: "error"; message: string };

function basicAuth(sid: string, token: string): string {
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

export async function provisionNumber(
  req: ProvisionNumberRequest,
): Promise<ProvisionNumberResult> {
  const c = serverConfig();
  const country = (req.country ?? "US").toUpperCase();

  if (!c.twilioAccountSid || !c.twilioAuthToken) {
    return {
      mode: "demo",
      callerNumber: demoCallerNumber(req.email),
      message:
        "Twilio is not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing) — demo number assigned; a real number is bought automatically once Twilio is connected.",
    };
  }

  const base = `https://api.twilio.com/2010-04-01/Accounts/${c.twilioAccountSid}`;
  const headers = { Authorization: basicAuth(c.twilioAccountSid, c.twilioAuthToken) };

  try {
    // 1) Find an available local number in the requested country.
    const search = await fetch(
      `${base}/AvailablePhoneNumbers/${country}/Local.json?VoiceEnabled=true&SmsEnabled=true&PageSize=1`,
      { headers },
    );
    if (!search.ok) {
      const text = await search.text().catch(() => "");
      return {
        mode: "error",
        message: `Twilio number search failed (${search.status}): ${text.slice(0, 300)}`,
      };
    }
    const found = (await search.json()) as {
      available_phone_numbers?: { phone_number?: string }[];
    };
    const candidate = found.available_phone_numbers?.[0]?.phone_number;
    if (!candidate) {
      return {
        mode: "error",
        message: `Twilio has no available local numbers in ${country} right now.`,
      };
    }

    // 2) Buy it under the platform master account and assign it to this
    //    customer (the workspace stores caller_number + phone SID; the
    //    number is then imported into ElevenLabs for outbound calls).
    const buy = await fetch(`${base}/IncomingPhoneNumbers.json`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        PhoneNumber: candidate,
        FriendlyName: `CallAgent subscriber ${req.email}`,
      }).toString(),
    });
    if (!buy.ok) {
      const text = await buy.text().catch(() => "");
      return {
        mode: "error",
        message: `Twilio number purchase failed (${buy.status}): ${text.slice(0, 300)}`,
      };
    }
    const purchased = (await buy.json()) as {
      phone_number?: string;
      sid?: string;
    };
    return {
      mode: "live",
      callerNumber: purchased.phone_number ?? candidate,
      phoneSid: purchased.sid ?? "",
    };
  } catch (err) {
    return {
      mode: "error",
      message: `Twilio request error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
