"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemo } from "@/components/DemoProvider";
import { AGENTS } from "@/lib/data";
import { parseNumberList } from "@/lib/phone";

const EXAMPLE = `+12145550134
+13125550198
+17035550127
+14065550163
+12135550141`;

export default function NewCampaignPage() {
  const router = useRouter();
  const { state, setCampaign } = useDemo();
  const activeSlug = state.subscription?.agentSlug ?? "truck-dispatcher";

  const [name, setName] = useState("");
  const [agentSlug, setAgentSlug] = useState<string>(activeSlug);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseNumberList(text), [text]);
  const valid = parsed.filter((p) => p.valid);
  const invalid = parsed.filter((p) => !p.valid && p.raw.length > 0);

  async function onFile(file: File) {
    const content = await file.text();
    setText((prev) => (prev ? `${prev}\n${content}` : content));
  }

  function startCalling() {
    if (valid.length === 0) {
      setError("Add at least one valid phone number (with country code, e.g. +1 …).");
      return;
    }
    if (!consent) {
      setError("Please confirm you have permission to call these numbers.");
      return;
    }
    const campaignName =
      name.trim() ||
      `Campaign — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    setCampaign({
      name: campaignName,
      agentSlug: agentSlug as typeof activeSlug,
      createdAt: new Date().toISOString().slice(0, 10),
      status: "running",
      results: valid.map((p) => ({
        phone: p.normalized,
        status: "Pending" as const,
        durationSec: 0,
        outcome: null,
        summary: null,
        transcript: [],
      })),
    });
    router.push("/dashboard/live");
  }

  return (
    <>
      <div className="dash-head">
        <h1>New Campaign — just add numbers</h1>
        <div className="right"><span className="badge demo">Demo Mode</span></div>
      </div>
      <p className="muted">
        No names, no notes, nothing else. Paste the phone numbers, press{" "}
        <strong style={{ color: "#fff" }}>Start Calling</strong>, and the AI
        caller starts ringing them one by one. Every call gets a summary in{" "}
        <Link href="/dashboard/results">Call Results</Link>.
      </p>

      <div className="card">
        <label className="flabel" htmlFor="cname">Campaign name (optional)</label>
        <input
          id="cname" type="text" value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Auto-filled if left empty, e.g. Campaign — Oct 24"
        />

        <label className="flabel" htmlFor="agent">Agent</label>
        <select
          id="agent" value={agentSlug}
          onChange={(e) => setAgentSlug(e.target.value)}
        >
          {AGENTS.map((a) => {
            const locked = a.slug !== activeSlug;
            return (
              <option key={a.slug} value={a.slug} disabled={locked}>
                {a.icon} {a.name}{locked ? " — locked (not subscribed)" : " — active"}
              </option>
            );
          })}
        </select>

        <label className="flabel" htmlFor="numbers">Phone numbers (one per line)</label>
        <textarea
          id="numbers" rows={9} value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"+12145550134\n+13125550198\n+17035550127"}
          style={{ fontVariantNumeric: "tabular-nums" }}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
          <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>
            Upload .csv / .txt
          </button>
          <input
            ref={fileRef} type="file" accept=".csv,.txt" hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
          <button className="btn ghost sm" onClick={() => setText(EXAMPLE)}>
            Fill with example numbers
          </button>
          <span className="badge blue">{valid.length} valid numbers found</span>
          {invalid.length > 0 && (
            <span className="badge red">{invalid.length} invalid — excluded</span>
          )}
        </div>

        {invalid.length > 0 && (
          <div className="alert" style={{ marginTop: 14 }}>
            <strong>These numbers will NOT be called:</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {invalid.slice(0, 8).map((p) => (
                <li key={p.raw}>{p.raw} — {p.error}</li>
              ))}
              {invalid.length > 8 && <li>…and {invalid.length - 8} more</li>}
            </ul>
          </div>
        )}

        {valid.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <strong className="small">Numbers to call (preview)</strong>
            <div style={{ marginTop: 8, maxHeight: 180, overflowY: "auto" }}>
              {valid.slice(0, 50).map((p, i) => (
                <div className="queue-row" key={p.normalized} style={{ padding: "7px 12px" }}>
                  <span className="muted small">#{i + 1}</span>
                  <span className="phone">{p.normalized}</span>
                  <span className="badge green" style={{ marginLeft: "auto" }}>Valid ✓</span>
                </div>
              ))}
              {valid.length > 50 && (
                <p className="small muted">…and {valid.length - 50} more numbers</p>
              )}
            </div>
          </div>
        )}

        <div className="checkbox-row">
          <input
            type="checkbox" id="consent" checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <label htmlFor="consent">
            I confirm I have permission to call these numbers and that they are
            not on a do-not-call list. Calls run one by one, inside calling
            hours.
          </label>
        </div>

        {error && <p style={{ color: "var(--red)" }}>{error}</p>}

        <button className="btn block" onClick={startCalling} disabled={valid.length === 0 || !consent}>
          📞 Start Calling ({valid.length} numbers)
        </button>
      </div>
    </>
  );
}
