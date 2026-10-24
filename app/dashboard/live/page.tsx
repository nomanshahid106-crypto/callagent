"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useDemo, type Campaign } from "@/components/DemoProvider";
import { getAgent, getPlan } from "@/lib/data";
import { formatDuration } from "@/lib/phone";
import { scenarioFor, type CallResult } from "@/lib/simulation";
import { StatusBadge } from "@/components/StatusBadge";

export default function LivePage() {
  const { state, setCampaign, addUsage } = useDemo();
  const campaign = state.campaign;
  const [liveLines, setLiveLines] = useState<string[]>([]);
  const linePtr = useRef<{ phone: string; count: number }>({ phone: "", count: 0 });
  const campaignRef = useRef<Campaign | null>(null);
  campaignRef.current = campaign;

  const agent = campaign ? getAgent(campaign.agentSlug) : undefined;
  const plan = getPlan(state.subscription?.planId ?? "growth");
  const included = plan?.includedMinutes ?? 400;
  const overage = plan?.overageRate ?? 0.3;

  useEffect(() => {
    if (!campaign || campaign.status !== "running") return;

    const timer = window.setInterval(() => {
      const c = campaignRef.current;
      if (!c || c.status !== "running") return;

      const callingIdx = c.results.findIndex((r) => r.status === "Calling");
      const pendingIdx = c.results.findIndex((r) => r.status === "Pending");

      // Start the next call
      if (callingIdx === -1) {
        if (pendingIdx === -1) {
          setCampaign({ ...c, status: "completed" });
          return;
        }
        const next = c.results[pendingIdx];
        const results = c.results.map((r, i) =>
          i === pendingIdx ? { ...r, status: "Calling" as const } : r,
        );
        linePtr.current = { phone: next.phone, count: 0 };
        setLiveLines([`Dialling ${next.phone}…`]);
        setCampaign({ ...c, results });
        // Ask the server to place the real call. In demo mode the API
        // returns { mode: "demo" } and this simulation carries on; when
        // ElevenLabs is configured it returns mode:"live".
        void fetch("/api/calls/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toNumber: next.phone, agentSlug: c.agentSlug }),
        }).catch(() => undefined);
        return;
      }

      // Stream the current call's transcript, then finalise it
      const current = c.results[callingIdx];
      const scenario = scenarioFor(c.agentSlug, current.phone);
      const ptr = linePtr.current.phone === current.phone ? linePtr.current.count : 0;

      if (ptr < scenario.transcript.length) {
        const line = scenario.transcript[ptr];
        linePtr.current = { phone: current.phone, count: ptr + 1 };
        setLiveLines((lines) => [...lines, line]);
        const results = c.results.map((r, i) =>
          i === callingIdx ? { ...r, transcript: [...r.transcript, line] } : r,
        );
        setCampaign({ ...c, results });
        return;
      }

      // Finalise: status, outcome, AI summary + minute metering
      const finished: CallResult = {
        ...current,
        status: scenario.status,
        outcome: scenario.outcome,
        durationSec: scenario.durationSec,
        summary: scenario.summary,
        transcript: current.transcript.length ? current.transcript : scenario.transcript,
      };
      const results = c.results.map((r, i) => (i === callingIdx ? finished : r));
      const minutes = Math.ceil(scenario.durationSec / 60);
      if (minutes > 0) {
        const excess = Math.max(
          0,
          state.minutesUsed + minutes - included,
        );
        const chargeable = Math.min(minutes, excess);
        addUsage(minutes, chargeable * overage);
      }
      const allDone = results.every(
        (r) => r.status !== "Pending" && r.status !== "Calling",
      );
      setCampaign({ ...c, results, status: allDone ? "completed" : c.status });
    }, 1100);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign?.status, campaign?.name]);

  if (!campaign) {
    return (
      <>
        <div className="dash-head">
          <h1>Live Campaign</h1>
          <div className="right"><span className="badge demo">Demo Mode</span></div>
        </div>
        <div className="card center">
          <div style={{ fontSize: "2.4rem" }}>📞</div>
          <h2 style={{ fontSize: "1.3rem" }}>No campaign running</h2>
          <p className="muted">
            Create a campaign with just your phone numbers and the AI caller
            starts ringing them one by one — watch it live here.
          </p>
          <Link href="/dashboard/campaigns/new" className="btn">+ New Campaign</Link>
          <p className="small muted" style={{ marginTop: 14 }}>
            Or view the sample results in{" "}
            <Link href="/dashboard/results">Call Results</Link>.
          </p>
        </div>
      </>
    );
  }

  const total = campaign.results.length;
  const done = campaign.results.filter(
    (r) => r.status !== "Pending" && r.status !== "Calling",
  ).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const current = campaign.results.find((r) => r.status === "Calling");

  function pauseResume() {
    if (!campaign) return;
    setCampaign({
      ...campaign,
      status: campaign.status === "running" ? "paused" : "running",
    });
  }

  function stop() {
    if (!campaign) return;
    const results = campaign.results.map((r) =>
      r.status === "Calling"
        ? {
            ...r,
            status: "Failed" as const,
            outcome: "Stopped",
            summary: "Campaign was stopped by the customer before this call finished.",
          }
        : r,
    );
    setCampaign({ ...campaign, results, status: "stopped" });
  }

  return (
    <>
      <div className="dash-head">
        <h1>Live Campaign — {campaign.name}</h1>
        <div className="right">
          <span className="badge demo">Demo Mode</span>
          {campaign.status === "running" && (
            <span className="badge green"><span className="pulse" /> Calling live</span>
          )}
          {campaign.status === "paused" && <span className="badge amber">Paused</span>}
          {campaign.status === "completed" && <span className="badge blue">Completed</span>}
          {campaign.status === "stopped" && <span className="badge red">Stopped</span>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <strong>{agent?.icon} {agent?.name}</strong>
            <div className="small muted">
              {done} of {total} numbers called · calls run one by one
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {(campaign.status === "running" || campaign.status === "paused") && (
              <>
                <button className="btn ghost sm" onClick={pauseResume}>
                  {campaign.status === "running" ? "⏸ Pause" : "▶ Resume"}
                </button>
                <button className="btn danger sm" onClick={stop}>⏹ Stop</button>
              </>
            )}
            <Link href="/dashboard/results" className="btn sm">View Call Results</Link>
          </div>
        </div>
        <div className="bar big" style={{ marginTop: 14 }}>
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <h3>Call queue</h3>
          {campaign.results.map((r, i) => (
            <div className={`queue-row ${r.status === "Calling" ? "calling" : ""}`} key={r.phone}>
              <span className="muted small">#{i + 1}</span>
              <span className="phone">{r.phone}</span>
              {r.status === "Calling" && <span className="pulse" />}
              <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                {r.durationSec > 0 && (
                  <span className="small muted">{formatDuration(r.durationSec)}</span>
                )}
                <StatusBadge status={r.status} />
              </span>
            </div>
          ))}
        </div>

        <div>
          <h3>
            Live transcript{" "}
            {current && <span className="muted small">— calling {current.phone}</span>}
          </h3>
          <div className="transcript">
            {liveLines.length === 0 && (
              <p className="muted">
                {campaign.status === "completed"
                  ? "Campaign finished. Full transcripts and summaries are in Call Results."
                  : "Waiting for the next call…"}
              </p>
            )}
            {liveLines.map((line, i) => {
              const splitAt = line.indexOf(":");
              const who = splitAt > 0 ? line.slice(0, splitAt) : "";
              const rest = splitAt > 0 ? line.slice(splitAt + 1) : line;
              return (
                <div className="line" key={i}>
                  {who && <span className="who">{who}:</span>}
                  {rest}
                </div>
              );
            })}
          </div>

          <h3 style={{ marginTop: 20 }}>Latest results</h3>
          {campaign.results
            .filter((r) => r.summary)
            .slice(-3)
            .reverse()
            .map((r) => (
              <div className="card" key={r.phone} style={{ padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <strong>{r.phone}</strong>
                  <StatusBadge status={r.status} />
                  {r.outcome && <span className="badge blue">{r.outcome}</span>}
                </div>
                <p className="muted small" style={{ margin: "8px 0 0" }}>{r.summary}</p>
              </div>
            ))}
          {campaign.results.every((r) => !r.summary) && (
            <p className="muted small">Summaries appear here as each call finishes.</p>
          )}
        </div>
      </div>
    </>
  );
}

