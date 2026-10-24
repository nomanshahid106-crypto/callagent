"use client";

import { useState } from "react";
import Link from "next/link";
import { useDemo } from "@/components/DemoProvider";
import { getAgent, getPlan, PLANS } from "@/lib/data";

const DEMO_HISTORY = [
  { date: "2026-10-24", desc: "Truck Dispatcher Agent — Growth plan (monthly)", method: "Paddle · Card •• 4242", amount: "$99.00", status: "Paid" },
  { date: "2026-10-11", desc: "Wallet top-up", method: "Paddle · Card •• 4242", amount: "$25.00", status: "Paid" },
  { date: "2026-09-24", desc: "Truck Dispatcher Agent — Growth plan (monthly)", method: "Paddle · Card •• 4242", amount: "$99.00", status: "Paid" },
];

export default function BillingPage() {
  const { state, topUpWallet } = useDemo();
  const [topped, setTopped] = useState<number | null>(null);

  const agent = state.subscription ? getAgent(state.subscription.agentSlug) : undefined;
  const plan = state.subscription
    ? getPlan(state.subscription.planId)
    : getPlan("growth");
  const included = plan?.includedMinutes ?? 400;
  const pct = Math.min(100, Math.round((state.minutesUsed / included) * 100));

  function topUp(amount: number) {
    topUpWallet(amount);
    setTopped(amount);
    window.setTimeout(() => setTopped(null), 2500);
  }

  return (
    <>
      <div className="dash-head">
        <h1>Billing</h1>
        <div className="right"><span className="badge demo">Demo Mode</span></div>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="card hl">
          <h3>Active subscription</h3>
          {agent && plan ? (
            <>
              <p style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                {agent.icon} {agent.name} — {plan.name}
              </p>
              <p className="muted">
                ${plan.priceMonthly}/month · renews{" "}
                {state.subscription?.renewalDate ?? "next month"} · billed by
                Paddle
              </p>
              <div className="order-row">
                <span>Minutes used this month</span>
                <span>{state.minutesUsed} / {included}</span>
              </div>
              <div className="bar" style={{ margin: "10px 0" }}>
                <div style={{ width: `${pct}%` }} />
              </div>
              <p className="small muted">
                After your {included} included minutes, calls continue from
                your wallet at ${plan.overageRate.toFixed(2)}/min. No wallet
                balance = campaigns pause automatically.
              </p>
              <span className="badge green">● Active</span>
            </>
          ) : (
            <p className="muted">
              No active subscription.{" "}
              <Link href="/#agents">Choose an agent</Link> to subscribe.
            </p>
          )}
        </div>

        <div className="card">
          <h3>Minute wallet</h3>
          <div className="stat">
            <div className="num">${state.wallet.toFixed(2)}</div>
            <div className="lbl">Prepaid balance for overage minutes</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {[10, 25, 50].map((amt) => (
              <button key={amt} className="btn ghost sm" onClick={() => topUp(amt)}>
                + Top up ${amt}
              </button>
            ))}
          </div>
          {topped !== null && (
            <p style={{ color: "var(--green)", marginTop: 12 }}>
              ✅ ${topped} added (demo — Paddle checkout in production).
            </p>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: "1.3rem", marginTop: 34 }}>Plans (per agent)</h2>
      <div className="grid-3">
        {PLANS.map((p) => {
          const current = plan?.id === p.id;
          return (
            <div className={`card ${current ? "hl" : ""}`} key={p.id}>
              <h3>{p.name}</h3>
              <div className="price">${p.priceMonthly}<span> / month</span></div>
              <p className="muted small">
                {p.includedMinutes.toLocaleString()} minutes · overage $
                {p.overageRate.toFixed(2)}/min · up to{" "}
                {p.contactsPerCampaign.toLocaleString()} numbers per campaign
              </p>
              <ul style={{ paddingLeft: 18, color: "var(--muted)" }}>
                {p.features.map((f) => <li key={f} style={{ marginBottom: 5 }}>{f}</li>)}
              </ul>
              {current ? (
                <span className="badge green">Current plan</span>
              ) : (
                <button className="btn ghost block" disabled title="Plan changes run through Paddle in production">
                  {p.priceMonthly > (plan?.priceMonthly ?? 0) ? "Upgrade" : "Switch"} (demo)
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 26 }}>
        <h3>Payment history</h3>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Method</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {DEMO_HISTORY.map((row) => (
                <tr key={`${row.date}-${row.desc}`}>
                  <td>{row.date}</td>
                  <td>{row.desc}</td>
                  <td>{row.method}</td>
                  <td>{row.amount}</td>
                  <td><span className="badge green">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          Sample history (demo). In production these rows come from Paddle
          transactions and invoices.
        </p>
      </div>
    </>
  );
}
