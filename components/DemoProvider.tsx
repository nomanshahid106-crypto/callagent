"use client";

/**
 * Demo state store.
 *
 * Until Supabase is configured, the whole product runs in DEMO mode:
 * the session, subscription, wallet, minutes and the current campaign live
 * in localStorage. The shape mirrors supabase/schema.sql so wiring the real
 * backend later is a data-source swap, not a rewrite.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AgentSlug } from "@/lib/data";
import type { CallResult } from "@/lib/simulation";

export interface DemoUser {
  name: string;
  business: string;
  email: string;
}

export interface DemoSubscription {
  agentSlug: AgentSlug;
  planId: string;
  status: "active";
  startedAt: string;
  renewalDate: string;
  /**
   * Provisioning on subscription (Step 3b, owner's workflow 2026-11-11):
   * the system buys a caller number for this customer and allocates his
   * plan's specific minutes. In demo mode the number is a labelled demo
   * number (see POST /api/provision → lib/integrations/twilio.ts).
   */
  callerNumber?: string;
  minutesAllocated?: number;
  provisioningMode?: "demo" | "live";
  provisionedAt?: string;
}

/** Provisioning result handed to subscribe() when a subscription activates. */
export interface ProvisioningInfo {
  callerNumber: string;
  minutesAllocated: number;
  mode: "demo" | "live";
}

export type CampaignRunStatus = "running" | "paused" | "stopped" | "completed";

export interface Campaign {
  name: string;
  agentSlug: AgentSlug;
  createdAt: string;
  status: CampaignRunStatus;
  results: CallResult[];
}

export interface DemoState {
  user: DemoUser | null;
  subscription: DemoSubscription | null;
  /** Set right after a subscription payment; the login page shows a notice. */
  justSubscribed: { agentSlug: AgentSlug; planId: string; email: string } | null;
  wallet: number; // USD
  minutesUsed: number;
  campaign: Campaign | null;
}

const STORAGE_KEY = "callagent-demo-state-v1";

const DEFAULT_STATE: DemoState = {
  user: null,
  subscription: null,
  justSubscribed: null,
  wallet: 46.2,
  minutesUsed: 212,
  campaign: null,
};

interface DemoContextValue {
  ready: boolean;
  state: DemoState;
  update: (patch: Partial<DemoState>) => void;
  login: (user: DemoUser) => void;
  logout: () => void;
  subscribe: (
    agentSlug: AgentSlug,
    planId: string,
    user: DemoUser,
    provisioning?: ProvisioningInfo,
  ) => void;
  setCampaign: (campaign: Campaign | null) => void;
  addUsage: (minutes: number, walletCharge: number) => void;
  topUpWallet: (amount: number) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function renewalDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<DemoState>(DEFAULT_STATE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        setState({ ...DEFAULT_STATE, ...parsed });
      }
    } catch {
      // corrupted storage — fall back to defaults
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full/unavailable — demo continues in-memory
    }
  }, [state, ready]);

  const value = useMemo<DemoContextValue>(
    () => ({
      ready,
      state,
      update: (patch) => setState((s) => ({ ...s, ...patch })),
      login: (user) => setState((s) => ({ ...s, user })),
      logout: () =>
        setState((s) => ({ ...s, user: null, justSubscribed: null })),
      subscribe: (agentSlug, planId, user, provisioning) =>
        setState((s) => ({
          ...s,
          subscription: {
            agentSlug,
            planId,
            status: "active",
            startedAt: new Date().toISOString().slice(0, 10),
            renewalDate: renewalDate(),
            callerNumber: provisioning?.callerNumber,
            minutesAllocated: provisioning?.minutesAllocated,
            provisioningMode: provisioning?.mode,
            provisionedAt: provisioning
              ? new Date().toISOString().slice(0, 10)
              : undefined,
          },
          justSubscribed: { agentSlug, planId, email: user.email },
          user: null, // per the final workflow, the customer logs in next
        })),
      setCampaign: (campaign) => setState((s) => ({ ...s, campaign })),
      addUsage: (minutes, walletCharge) =>
        setState((s) => ({
          ...s,
          minutesUsed: s.minutesUsed + minutes,
          wallet: Math.max(0, s.wallet - walletCharge),
        })),
      topUpWallet: (amount) =>
        setState((s) => ({ ...s, wallet: s.wallet + amount })),
    }),
    [ready, state],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
