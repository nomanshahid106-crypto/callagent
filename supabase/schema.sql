-- ═══════════════════════════════════════════════════════════════════════════
-- CallAgent — Supabase schema (production)
-- Run once in the Supabase SQL editor after creating the project.
-- Multi-tenant: every customer is a workspace; RLS keeps workspaces isolated.
-- Money is ledger-based: minutes_ledger + wallet_transactions are the truth.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Workspaces & users ────────────────────────────────────────────────────
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,                       -- business name
  owner_id uuid not null,                   -- auth.users id
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key,                      -- auth.users id
  workspace_id uuid not null references workspaces(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'owner',       -- owner | member
  created_at timestamptz not null default now()
);

-- ─── Plans (owner-editable config — prices change without a deploy) ───────
create table if not exists plans (
  id text primary key,                      -- starter | growth | business
  name text not null,
  price_monthly_usd numeric(10,2) not null,
  included_minutes int not null,
  overage_rate_usd numeric(6,3) not null,
  contacts_per_campaign int not null,
  paddle_product_id text,
  is_active boolean not null default true
);

insert into plans (id, name, price_monthly_usd, included_minutes, overage_rate_usd, contacts_per_campaign) values
  ('starter',  'Starter',  39,  150,  0.35, 500),
  ('growth',   'Growth',   99,  400,  0.30, 2000),
  ('business', 'Business', 249, 1100, 0.25, 10000)
on conflict (id) do nothing;

-- ─── Per-agent subscriptions (subscription is PER AGENT, not platform-wide) ─
create table if not exists agent_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_slug text not null,                 -- truck-dispatcher | brand-approval
  plan_id text not null references plans(id),
  status text not null default 'active',    -- active | past_due | canceled
  paddle_subscription_id text,
  paddle_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  unique (workspace_id, agent_slug)
);

-- ─── Per-customer agent configuration ─────────────────────────────────────
create table if not exists agent_configs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_slug text not null,
  elevenlabs_agent_id text,                 -- customer's copy in ElevenLabs
  voice_id text,
  first_message text,
  system_prompt text,
  -- Dispatcher: { company_name, rate_min, rate_max, load_template }
  -- Brand:      { business_name, marketplaces, years, monthly_volume }
  business_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, agent_slug)
);

create table if not exists knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_slug text not null,
  file_name text not null,
  storage_path text not null,               -- Supabase Storage object
  elevenlabs_kb_id text,
  created_at timestamptz not null default now()
);

-- ─── Campaigns (numbers-only lists) & calls ───────────────────────────────
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_slug text not null,
  name text not null,
  status text not null default 'draft',     -- draft | running | paused | stopped | completed
  consent_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  phone_number text not null,               -- E.164 — the ONLY field the user provides
  position int not null,                    -- order in the list (calls run in order)
  status text not null default 'pending',   -- pending | calling | completed | no_answer | busy | failed
  unique (campaign_id, phone_number)
);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  contact_id uuid references campaign_contacts(id) on delete set null,
  agent_slug text not null,
  phone_number text not null,
  status text not null,                     -- completed | no_answer | busy | failed
  outcome text,                             -- agent-specific outcome label
  duration_seconds int not null default 0,
  billable_minutes numeric(8,2) not null default 0,
  summary text,                             -- AI-generated 1–2 line call summary
  transcript jsonb not null default '[]'::jsonb,
  recording_url text,
  elevenlabs_conversation_id text,
  twilio_call_sid text,
  created_at timestamptz not null default now()
);

-- ─── Money ledgers ─────────────────────────────────────────────────────────
create table if not exists minutes_ledger (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  call_id uuid references calls(id) on delete set null,
  source text not null,                     -- included | wallet
  minutes numeric(8,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type text not null,                       -- topup | call_charge | refund
  amount_usd numeric(10,2) not null,        -- + credit, − debit
  balance_after_usd numeric(10,2) not null,
  paddle_transaction_id text,
  call_id uuid references calls(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ─── Do-not-call (global + per-workspace) ──────────────────────────────────
create table if not exists do_not_call (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade, -- null = global
  phone_number text not null,
  reason text,
  created_at timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row-Level Security — ENABLED on every table.
-- Policy pattern (apply per table, shown for campaigns):
--   a user may only see rows whose workspace_id belongs to a workspace
--   where profiles.id = auth.uid().
--
--   alter table campaigns enable row level security;
--   create policy "workspace members only" on campaigns
--     for all using (
--       workspace_id in (
--         select workspace_id from profiles where id = auth.uid()
--       )
--     );
--
-- Repeat the same pattern for: profiles (id = auth.uid()), agent_subscriptions,
-- agent_configs, knowledge_docs, campaign_contacts, calls, minutes_ledger,
-- wallet_transactions, do_not_call. `plans` is public-read, owner-write.
-- The service_role key (server only, webhooks/worker) bypasses RLS — it must
-- never be shipped to the browser.
-- ═══════════════════════════════════════════════════════════════════════════
alter table workspaces           enable row level security;
alter table profiles             enable row level security;
alter table plans                enable row level security;
alter table agent_subscriptions  enable row level security;
alter table agent_configs        enable row level security;
alter table knowledge_docs       enable row level security;
alter table campaigns            enable row level security;
alter table campaign_contacts    enable row level security;
alter table calls                enable row level security;
alter table minutes_ledger       enable row level security;
alter table wallet_transactions  enable row level security;
alter table do_not_call          enable row level security;
