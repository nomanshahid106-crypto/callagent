"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { useDemo } from "@/components/DemoProvider";
import { getAgent, PLANS, type PlanDef } from "@/lib/data";
import { openCheckout } from "@/lib/integrations/paddle";

type Phase = "form" | "checkout" | "processing" | "success";

export default function SubscribePage() {
  const params = useParams<{ agentSlug: string }>();
  const router = useRouter();
  const { subscribe } = useDemo();
  const agent = getAgent(params.agentSlug);

  const [planId, setPlanId] = useState<string>("growth");
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("form");

  const plan: PlanDef = useMemo(
    () => PLANS.find((p) => p.id === planId) ?? PLANS[1],
    [planId],
  );

  if (!agent) {
    return (
      <>
        <PublicHeader />
        <main className="container" style={{ paddingTop: 60 }}>
          <div className="card">
            <h1>Agent not found</h1>
            <p className="muted">Please choose one of the two agents from the home page.</p>
            <Link href="/#agents" className="btn">Choose Your Agent</Link>
          </div>
        </main>
        <PublicFooter />
      </>
    );
  }

  function validate(): boolean {
    if (name.trim().length < 2) return setErr("Please enter your full name.");
    if (business.trim().length < 2) return setErr("Please enter your business name.");
    if (!email.includes("@")) return setErr("Please enter a valid email address.");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    setError("");
    return true;
  }
  function setErr(msg: string): boolean {
    setError(msg);
    return false;
  }

  async function onSubscribeClick() {
    if (!validate()) return;
    // Typed seam: returns mode:"demo" until Paddle is configured, in which
    // case the built-in demo checkout modal below is what the user sees.
    await openCheckout({ agentSlug: agent!.slug, planId, customerEmail: email });
    setPhase("checkout");
  }

  function onPay() {
    setPhase("processing");
    window.setTimeout(() => {
      subscribe(agent!.slug, planId, { name, business, email });
      setPhase("success");
    }, 1400);
  }

  return (
    <>
      <PublicHeader />
      <main className="container">
        {/* Step indicator — final workflow */}
        <div className="stepper">
          <span className="s done">1 · Choose Agent ✓</span>
          <span className="arrow">→</span>
          <span className="s current">2 · Create Account &amp; Pay Subscription</span>
          <span className="arrow">→</span>
          <span className="s">3 · Login</span>
          <span className="arrow">→</span>
          <span className="s">4 · Use Your Agent</span>
        </div>

        {phase === "success" ? (
          <div className="card center" style={{ maxWidth: 560, margin: "30px auto" }}>
            <div style={{ fontSize: "3rem" }}>✅</div>
            <h1 style={{ fontSize: "1.7rem" }}>Subscription Active</h1>
            <p className="muted">
              Your <strong style={{ color: "#fff" }}>{agent.name}</strong> is
              active on the <strong style={{ color: "#fff" }}>{plan.name}</strong>{" "}
              plan ({plan.includedMinutes} minutes included). Your account was
              created with <strong style={{ color: "#fff" }}>{email}</strong>.
            </p>
            <p className="muted">Next step: login to start using your agent.</p>
            <button className="btn white" onClick={() => router.push("/login")}>
              Proceed to Login →
            </button>
          </div>
        ) : (
          <div className="grid-2" style={{ alignItems: "start" }}>
            {/* Create account */}
            <div className="card">
              <h2 style={{ fontSize: "1.3rem", textAlign: "left" }}>
                Create Your Account
              </h2>
              <p className="muted small">
                Your subscription for the <strong>{agent.name}</strong> will be
                linked to this account.
              </p>
              <label className="flabel" htmlFor="name">Full name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith" />
              <label className="flabel" htmlFor="business">Business name</label>
              <input id="business" type="text" value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="e.g. SwiftLine Dispatch LLC" />
              <label className="flabel" htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              <label className="flabel" htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password (min. 6 characters)" />
              {error && <p style={{ color: "var(--red)", marginTop: 12 }}>{error}</p>}
            </div>

            {/* Plan + order summary */}
            <div>
              <div className="card">
                <h2 style={{ fontSize: "1.3rem", textAlign: "left" }}>
                  Choose Your Plan — {agent.icon} {agent.shortName}
                </h2>
                <div className="plan-pick" role="radiogroup" aria-label="Plan">
                  {PLANS.map((p) => (
                    <button
                      type="button" key={p.id}
                      className={`plan-option ${p.id === planId ? "sel" : ""}`}
                      onClick={() => setPlanId(p.id)}
                    >
                      <input type="radio" checked={p.id === planId} readOnly style={{ marginTop: 4, width: 18, height: 18, accentColor: "var(--accent)" }} />
                      <span>
                        <strong>{p.name}</strong> — ${p.priceMonthly}/mo
                        <br />
                        <span className="muted small">
                          {p.includedMinutes.toLocaleString()} minutes included ·
                          up to {p.contactsPerCampaign.toLocaleString()} numbers per campaign ·
                          overage ${p.overageRate.toFixed(2)}/min
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <h3>Order Summary</h3>
                <div className="order-row">
                  <span>{agent.name} — {plan.name} plan</span>
                  <span>${plan.priceMonthly}.00 / mo</span>
                </div>
                <div className="order-row">
                  <span>Included calling minutes</span>
                  <span>{plan.includedMinutes.toLocaleString()} min</span>
                </div>
                <div className="order-row">
                  <span>Due today</span>
                  <span>${plan.priceMonthly}.00</span>
                </div>
                <div className="order-row total">
                  <span>Total</span>
                  <span>${plan.priceMonthly}.00</span>
                </div>
                <button className="btn block" style={{ marginTop: 16 }} onClick={onSubscribeClick}>
                  Create Account, Subscribe &amp; Pay →
                </button>
                <p className="small muted" style={{ marginTop: 10 }}>
                  Secure checkout by <strong>Paddle</strong> (Merchant of
                  Record). Renews monthly; cancel anytime. Annual billing =
                  2 months free.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Demo Paddle checkout modal */}
      {(phase === "checkout" || phase === "processing") && (
        <div className="modal-back">
          <div className="modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Checkout</h3>
              <span className="badge demo">Demo checkout — Paddle sandbox in production</span>
            </div>
            <p className="muted small">
              {agent.name} · {plan.name} plan · billed to {email || "your email"}
            </p>
            <label className="flabel">Card number</label>
            <input type="text" defaultValue="4242 4242 4242 4242" aria-label="Card number" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="flabel">Expiry</label>
                <input type="text" defaultValue="12 / 28" aria-label="Expiry" />
              </div>
              <div>
                <label className="flabel">CVC</label>
                <input type="text" defaultValue="424" aria-label="CVC" />
              </div>
            </div>
            <button className="btn block" style={{ marginTop: 20 }} onClick={onPay} disabled={phase === "processing"}>
              {phase === "processing" ? "Processing payment…" : `Pay $${plan.priceMonthly}.00`}
            </button>
            <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setPhase("form")} disabled={phase === "processing"}>
              Cancel
            </button>
            <p className="small muted center" style={{ marginTop: 10 }}>
              Powered by Paddle. Demo mode — no real card is charged.
            </p>
          </div>
        </div>
      )}
      <PublicFooter />
    </>
  );
}
