"use client";

import Link from "next/link";
import { useDemo } from "@/components/DemoProvider";
import { AGENTS } from "@/lib/data";

export default function AgentsPage() {
  const { state } = useDemo();
  // Default demo subscription when the user came in via the demo account.
  const activeSlug =
    state.subscription?.agentSlug ?? "truck-dispatcher";
  const hasRealSub = Boolean(state.subscription);

  return (
    <>
      <div className="dash-head">
        <h1>My Agents</h1>
        <div className="right">
          <span className="badge demo">Demo Mode</span>
        </div>
      </div>
      <p className="muted">
        Your subscription is per agent. The agent you paid for is active; the
        other stays locked until you subscribe to it.
        {!hasRealSub && " (Demo account default: Truck Dispatcher on Growth.)"}
      </p>

      <div className="grid-2">
        {AGENTS.map((agent) => {
          const active = agent.slug === activeSlug;
          return (
            <div className={`card ${active ? "hl" : ""}`} key={agent.slug}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div className="agent-icon">{agent.icon}</div>
                {active ? (
                  <span className="badge green">● Active</span>
                ) : (
                  <span className="badge amber">🔒 Locked</span>
                )}
              </div>
              <h3 style={{ fontSize: "1.25rem", marginTop: 8 }}>{agent.name}</h3>
              <p style={{ fontWeight: 600 }}>{agent.tagline}</p>
              <p className="muted small">{agent.purpose}</p>
              <p className="small muted">
                <strong style={{ color: "#fff" }}>Calls:</strong> {agent.callsWho}
                <br />
                <strong style={{ color: "#fff" }}>Voice:</strong> {agent.voiceDefault}
              </p>
              <div style={{ margin: "10px 0" }}>
                {agent.outcomes.map((o) => (
                  <span className="chip" key={o}>{o}</span>
                ))}
              </div>
              <p className="small muted">
                <strong style={{ color: "#fff" }}>First message:</strong>{" "}
                “{agent.firstMessage}”
              </p>
              {active ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <Link href="/dashboard/campaigns/new" className="btn sm">Start Calling</Link>
                  <Link href="/dashboard/live" className="btn ghost sm">Live Campaign</Link>
                  <Link href="/dashboard/results" className="btn ghost sm">Call Results</Link>
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <Link href={`/subscribe/${agent.slug}`} className="btn white sm">
                    Subscribe to Unlock →
                  </Link>
                  <p className="small muted" style={{ marginTop: 8 }}>
                    From $39/mo · minutes included · billed by Paddle
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
