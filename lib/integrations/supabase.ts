/**
 * Supabase integration — PLACEHOLDER seam.
 *
 * The full production schema lives in `supabase/schema.sql` (workspaces,
 * profiles, agent_subscriptions, agent_configs, knowledge_docs, campaigns,
 * campaign_contacts, calls, minutes_ledger, wallet_transactions,
 * do_not_call, plans — all with Row-Level Security).
 *
 * To activate:
 *   1. Create the Supabase project and run supabase/schema.sql.
 *   2. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
 *      (+ SUPABASE_SERVICE_ROLE_KEY on the server only).
 *   3. `npm i @supabase/supabase-js` and replace the factory below with
 *      createClient(url, anonKey) / a service-role client for webhooks.
 *
 * While unconfigured the app runs entirely in DEMO mode (state in the
 * browser's localStorage), which is what this MVP ships with.
 */

import { isSupabaseConfigured, publicConfig } from "../config";

export function supabaseConfigured(): boolean {
  return isSupabaseConfigured();
}

export interface SupabaseStatus {
  configured: boolean;
  url: string | null;
  message: string;
}

export function getSupabaseStatus(): SupabaseStatus {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      url: null,
      message:
        "Supabase is not configured — demo mode (localStorage). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY and run supabase/schema.sql to go live.",
    };
  }
  return {
    configured: true,
    url: publicConfig.supabaseUrl,
    message: "Supabase configured. Wire @supabase/supabase-js here to use it.",
  };
}
