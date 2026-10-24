"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { useDemo } from "@/components/DemoProvider";
import { getAgent, getPlan } from "@/lib/data";

export default function LoginPage() {
  const router = useRouter();
  const { state, login, update } = useDemo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const just = state.justSubscribed;
  const justAgent = just ? getAgent(just.agentSlug) : undefined;
  const justPlan = just ? getPlan(just.planId) : undefined;

  useEffect(() => {
    if (just?.email) setEmail(just.email);
  }, [just?.email]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters (demo login).");
      return;
    }
    // Demo auth: any email/password works until Supabase Auth is connected.
    login({
      name: state.justSubscribed ? "New Customer" : "Demo Customer",
      business: "Demo Business",
      email,
    });
    update({ justSubscribed: null });
    router.push("/dashboard");
  }

  return (
    <>
      <PublicHeader />
      <main className="container">
        <div className="auth-wrap">
          {just && justAgent && (
            <div className="notice">
              ✅ <strong>Subscription active for {justAgent.name}</strong>
              {justPlan ? ` (${justPlan.name} plan)` : ""} — login to start
              using your agent.
            </div>
          )}
          <div className="card">
            <h1 style={{ fontSize: "1.5rem" }}>Login</h1>
            <p className="muted">Welcome back. Login to use your agent.</p>
            <form onSubmit={onSubmit}>
              <label className="flabel" htmlFor="email">Email</label>
              <input
                id="email" type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" autoComplete="email"
              />
              <label className="flabel" htmlFor="password">Password</label>
              <input
                id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password" autoComplete="current-password"
              />
              {error && (
                <p style={{ color: "var(--red)", marginTop: 12 }}>{error}</p>
              )}
              <button type="submit" className="btn block" style={{ marginTop: 20 }}>
                Sign In →
              </button>
            </form>
            <p className="small muted" style={{ marginTop: 16 }}>
              <span className="badge demo">Demo Mode</span> Demo login accepts
              any email and password — real accounts arrive with Supabase Auth.
            </p>
            <p className="small" style={{ marginTop: 10 }}>
              New here? <Link href="/#agents">Choose your agent</Link> to
              create an account and subscribe.
            </p>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
