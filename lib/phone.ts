/** Phone-number list parsing + validation for the numbers-only campaign flow. */

export interface ParsedNumber {
  raw: string;
  /** Normalised form, e.g. +15551234567. Empty when invalid. */
  normalized: string;
  valid: boolean;
  error?: string;
}

/**
 * Numbers must be in international format (+country code …).
 * A number without a leading + is flagged "missing country code";
 * fewer than 10 digits total is flagged "too short".
 */
export function parsePhoneNumber(rawInput: string): ParsedNumber {
  const raw = rawInput.trim();
  if (!raw) return { raw, normalized: "", valid: false, error: "Empty" };

  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");

  if (!hasPlus) {
    return {
      raw,
      normalized: "",
      valid: false,
      error: "Missing country code — start with + (e.g. +1 …)",
    };
  }
  if (digits.length < 10) {
    return { raw, normalized: "", valid: false, error: "Too short" };
  }
  if (digits.length > 15) {
    return { raw, normalized: "", valid: false, error: "Too long" };
  }
  return { raw, normalized: `+${digits}`, valid: true };
}

/** Split pasted text / file contents into candidate numbers (lines or CSV cells). */
export function splitNumberList(text: string): string[] {
  return text
    .split(/[\n\r,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseNumberList(text: string): ParsedNumber[] {
  const seen = new Set<string>();
  const out: ParsedNumber[] = [];
  for (const item of splitNumberList(text)) {
    const parsed = parsePhoneNumber(item);
    const key = parsed.valid ? parsed.normalized : item;
    if (seen.has(key)) continue; // de-duplicate
    seen.add(key);
    out.push(parsed);
  }
  return out;
}

export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds) return "0:00";
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
