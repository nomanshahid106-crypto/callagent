"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/PublicChrome";
import { useDemo } from "@/components/DemoProvider";
import { getAgent, getPlan } from "@/lib/data";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/agents", label: "My Agents", icon: "🤖" },
  { href: "/dashboard/campaigns/new", label: "New Campaign", icon: "📋" },
  { href: "/dashboard/live", label: "Live Campaign", icon: "📞" },
  { href: "/dashboard/results", label: "Call Results", icon: "📊" },
  { href: "/dashboard/billing", label: "Billing", icon: "💳" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, state, login, logout } = useDemo();

  if (!ready) {
    return <div className="container" style={{ paddingTop: 60 }}>Loading…</div>;
  }

  // Not signed in → gate (per the final workflow, login comes before use).
  if (!state.user) {
    return (
      <main className="container">
        <div className="auth-wrap">
          <div className="card center">
            <div style={{ fontSize: "2.4rem" }}>🔒</div>
            <h1 style={{ fontSize: "1.5rem" }}>Login required</h1>
            <p className="muted">
              You need to login before you can use your agent.
            </p>
            <Link href="/login" className="btn block">Go to Login</Link>
            <button
              className="btn ghost block"
              style={{ marginTop: 10 }}
              onClick={() => {
                login({
                  name: "Demo Customer",
                  business: "Demo Business",
                  email: "demo@callagent.app",
                });
              }}
            >
              Continue with the demo account
            </button>
            <p className="small muted" style={{ marginTop: 12 }}>
              Demo account: Truck Dispatcher Agent on the Growth plan.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const agent = state.subscription
    ? getAgent(state.subscription.agentSlug)
    : undefined;
  const plan = state.subscription
    ? getPlan(state.subscription.planId)
    : undefined;

  return (
    <div className="dash">
      <aside className="sidebar">
        <Logo />
        <div style={{ margin: "14px 0 10px" }}>
          <span className="badge demo">Demo Mode</span>
        </div>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`item ${pathname === item.href ? "active" : ""}`}
          >
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}
        <div className="spacer" />
        <div className="card" style={{ padding: 14 }}>
          <div className="small muted">Signed in as</div>
          <div style={{ fontWeight: 700 }}>{state.user.name}</div>
          <div className="small muted">{state.user.email}</div>
          {agent && plan ? (
            <div style={{ marginTop: 10 }}>
              <span className="badge green">{agent.shortName} · {plan.name}</span>
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              <span className="badge amber">No active agent</span>
            </div>
          )}
          <button
            className="btn ghost sm block"
            style={{ marginTop: 12 }}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>
      <div className="dash-main">{children}</div>
    </div>
  );
}
