import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { AGENTS, PLANS, WORKFLOW_STEPS } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main>
        {/* Hero */}
        <section className="hero container">
          <span className="badge blue">AI call agents · SaaS</span>
          <h1>Give it a list of phone numbers. The AI does the calling.</h1>
          <p className="sub">
            CallAgent&apos;s AI callers ring your numbers one by one, hold the
            conversation for you, then save a summary and a result for every
            call. You just read the results list.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="#agents" className="btn white">
              Choose Your Agent →
            </Link>
            <Link href="#how" className="btn ghost">
              How It Works
            </Link>
          </div>
          <p className="small muted" style={{ marginTop: 16 }}>
            No names or notes needed — just the phone numbers.
          </p>
        </section>

        {/* Choose your agent */}
        <section className="section container" id="agents">
          <h2>Choose Your Agent</h2>
          <p className="lead">
            Two specialist agents at launch. You subscribe per agent — only pay
            for the one you use.
          </p>
          <div className="grid-2">
            {AGENTS.map((agent) => (
              <div className="card" key={agent.slug}>
                <div className="agent-icon">{agent.icon}</div>
                <h3 style={{ fontSize: "1.3rem", marginTop: 8 }}>{agent.name}</h3>
                <p style={{ fontWeight: 600 }}>{agent.tagline}</p>
                <p className="muted">{agent.purpose}</p>
                <p className="small muted">
                  <strong style={{ color: "#fff" }}>Calls:</strong> {agent.callsWho}
                </p>
                <div style={{ margin: "12px 0" }}>
                  {agent.outcomes.map((o) => (
                    <span className="chip" key={o}>{o}</span>
                  ))}
                </div>
                <p className="muted">
                  From <strong style={{ color: "#fff" }}>$39/mo</strong> · 150
                  minutes included
                </p>
                <Link href={`/subscribe/${agent.slug}`} className="btn block">
                  Select This Agent →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="section container" id="how">
          <h2>How It Works</h2>
          <p className="lead">Four steps between you and a finished call list.</p>
          <div className="grid-4 steps">
            {WORKFLOW_STEPS.map((s) => (
              <div className="card" key={s.n}>
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p className="muted small">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing strip */}
        <section className="section container" id="pricing">
          <h2>Simple subscription pricing — per agent</h2>
          <p className="lead">
            Every plan includes calling minutes. When they run out, calls
            continue from your prepaid wallet — you never get a surprise bill.
          </p>
          <div className="grid-3">
            {PLANS.map((plan) => (
              <div className={`card ${plan.id === "growth" ? "hl" : ""}`} key={plan.id}>
                {plan.id === "growth" && (
                  <span className="badge blue" style={{ marginBottom: 10 }}>Most popular</span>
                )}
                <h3>{plan.name}</h3>
                <div className="price">
                  ${plan.priceMonthly}
                  <span> / month</span>
                </div>
                <p className="muted small">
                  {plan.includedMinutes.toLocaleString()} minutes included ·
                  then ${plan.overageRate.toFixed(2)}/min from wallet
                </p>
                <ul style={{ paddingLeft: 18, color: "var(--muted)" }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ marginBottom: 6 }}>{f}</li>
                  ))}
                </ul>
                <Link href="/subscribe/truck-dispatcher" className="btn ghost block">
                  Start with {plan.name}
                </Link>
              </div>
            ))}
          </div>
          <p className="small muted center" style={{ marginTop: 14 }}>
            Annual billing = 2 months free. Payments processed by Paddle.
          </p>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
