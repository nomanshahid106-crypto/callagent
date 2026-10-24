"use client";

import Link from "next/link";
import { useDemo } from "@/components/DemoProvider";
import { getAgent, getPlan } from "@/lib/data";
import { SAMPLE_CAMPAIGN, SAMPLE_RESULTS } from "@/lib/simulation";

export default function DashboardHome() {
  const { state } = useDemo();
  const plan = state.subscription ? getPlan(state.subscription.planId) : undefined;
  const agent = state.subscription ? getAgent(state.subscription.agentSlug) : undefined;
  const included = plan?.includedMinutes ?? 400;
  const pct = Math.min(100, Math.round((state.minutesUsed / included) * 100));

  const campaign = state.campaign;
  const campaignAnswered = campaign
    ? campaign.results.filter((r) => r.status === "Completed").length
    : 0;
  const campaignHeadline = campaign && agent
    ? campaign.results.filter((r) => r.outcome === agent.headlineOutcome).length
    : 0;
  const sampleAnswered = SAMPLE_RESULTS.filter((r) => r.status === "Completed").length;
  const sampleBooked = SAMPLE_RESULTS.filter((r) => r.outcome === "Load Booked").length;

  return (
    <>
      <div className="dash-head">
        <h1>Dashboard</h1>
        <div className="right">
          <span className="badge demo">Demo Mode</span>
          <Link href="/dashboard/campaigns/new" className="btn sm">+ New Campaign</Link>
        </div>
      </div>

      <div className="grid-4">
        <div className="card stat">
          <div className="num">128</div>
          <div className="lbl">Total Calls (this month)</div>
        </div>
        <div className="card stat">
          <div className="num">86</div>
          <div className="lbl">Answered</div>
        </div>
        <div className="card stat">
          <div className="num">{state.minutesUsed} <span style={{ fontSize: "1rem", color: "var(--muted)" }}>/ {included}</span></div>
          <div className="lbl">Minutes Used</div>
          <div className="bar" style={{ marginTop: 10 }}>
            <div style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="card stat">
          <div className="num">${state.wallet.toFixed(2)}</div>
          <div className="lbl">Wallet Balance</div>
          <Link href="/dashboard/billing" className="small">Top up →</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Your Agent</h3>
        {agent && plan ? (
          <p className="muted" style={{ margin: 0 }}>
            {agent.icon} <strong style={{ color: "#fff" }}>{agent.name}</strong>{" "}
            is <span className="badge green">Active</span> on the {plan.name}{" "}
            plan. Paste your phone numbers and press Start Calling — results
            and summaries appear in Call Results.
          </p>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No active subscription yet.{" "}
            <Link href="/#agents">Choose an agent</Link> to get started.
          </p>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Recent Campaigns</h3>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Campaign</th><th>Agent</th><th>Numbers</th><th>Result summary</th><th></th></tr>
            </thead>
            <tbody>
              {campaign && (
                <tr>
                  <td><strong>{campaign.name}</strong><br /><span className="small muted">{campaign.createdAt} · {campaign.status}</span></td>
                  <td>{getAgent(campaign.agentSlug)?.shortName}</td>
                  <td>{campaign.results.length}</td>
                  <td>{campaign.results.length} numbers · {campaignAnswered} answered · {campaignHeadline} × {agent?.headlineOutcome ?? "headline outcome"}</td>
                  <td><Link href="/dashboard/results">View results →</Link></td>
                </tr>
              )}
              <tr>
                <td><strong>{SAMPLE_CAMPAIGN.name}</strong><br /><span className="small muted">{SAMPLE_CAMPAIGN.createdAt} · completed · sample data</span></td>
                <td>Truck Dispatcher</td>
                <td>{SAMPLE_RESULTS.length}</td>
                <td>{SAMPLE_RESULTS.length} numbers · {sampleAnswered} answered · {sampleBooked} loads booked</td>
                <td><Link href="/dashboard/results">View results →</Link></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
