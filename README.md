# CallAgent — AI Call Agents That Call For You

A SaaS product: customers pick an AI call agent, subscribe per agent, paste a
list of **phone numbers only**, and the AI calls them **one by one**, then
hands back an **AI summary and a result for every call**.

## The two launch agents

1. **Truck Dispatcher Agent** — calls drivers/owner-operators, checks
   location/equipment/availability, offers a load, negotiates only inside the
   customer's rate range. Outcomes: Load Booked · Interested — Callback ·
   Not Available · Rate Too Low · No Answer · Wrong Number · Do Not Call.
2. **E-commerce Brand Approval Agent** — calls brands/manufacturers for
   Amazon/Walmart/eBay authorised-reseller approval: requirements, MOQ, MAP,
   application email/process. Outcomes: Approved · Application Details
   Received · Documents Required · Not Accepting Resellers · Marketplace Not
   Allowed · Callback Scheduled · No Answer · Wrong Number · Do Not Call.

## Final workflow (user-confirmed)

**Choose Agent → Create Account & Pay Subscription → Login → Use Your Agent**

1. Home page → customer selects the agent he wants.
2. Subscribe page → creates his account, picks a plan, pays the per-agent
   subscription (Paddle).
3. Login → signs in with the account he just created.
4. Dashboard → pastes phone numbers only → **Start Calling** → watches calls
   live → reads the **Call Results** list (status, duration, outcome, AI
   summary, transcript per number).

### Provisioning on subscription (automatic)

The moment a subscription activates, the system provisions that customer's
calling resources — no manual step for him or for support:

1. **Buys a phone number** — a number is bought on Twilio (platform master
   account) and **assigned to that customer** as his dedicated caller
   number (imported into ElevenLabs so it has its own phone-number ID).
2. **Allocates his plan's specific minutes** — Starter 150 / Growth 400 /
   Business 1,100 minutes are credited to his account; calls deduct from
   these first, the prepaid wallet covers overage.
3. **Calls go from his number** — every campaign call is established from
   the number assigned to him, so recipients always see his own consistent
   caller ID.

On cancellation/expiry the number is released back to the platform pool
after a grace period and unspent plan minutes expire. In demo mode the
provisioning returns a clearly-labelled **demo number** (deterministic per
account, from the fictional 555-01XX range) plus the plan minutes, and the
assigned number + minutes are shown on the subscribe success screen, the
Dashboard ("Your Caller Number"), My Agents, Billing, the New Campaign
screen, and as "Calling from:" on the Live Campaign screen.

## Plans (per agent, billed by Paddle)

| Plan | Price | Included minutes | Overage (wallet) | Numbers / campaign |
|---|---|---|---|---|
| Starter | $39/mo | 150 | $0.35/min | 500 |
| Growth | $99/mo | 400 | $0.30/min | 2,000 |
| Business | $249/mo | 1,100 | $0.25/min | 10,000 |

Annual billing = 2 months free. Money logic is ledger-based in production
(subscription minutes first, prepaid wallet second; no balance = campaigns
pause).

## What's built in this MVP

- `/` — public home: hero, Choose Your Agent, How It Works (the 4 final
  steps), pricing, footer (payments by Paddle).
- `/subscribe/[agentSlug]` — step indicator, create-account form, plan picker
  with live order summary, demo Paddle checkout modal, success →
  *Proceed to Login*. On activation the subscription is **provisioned**
  (POST `/api/provision`): the success screen shows the assigned caller
  number and the plan minutes allocated.
- `/login` — sign-in; after a fresh subscription shows
  *"Subscription active for X — login to start using your agent"*.
- `/dashboard` — stats (calls, answered, minutes used vs plan, wallet),
  a **Your Caller Number** card (assigned number + minutes allocated /
  remaining), recent campaigns with mini result summaries.
- `/dashboard/agents` — subscribed agent Active (shows *"Calls will be made
  from"* its assigned number), the other Locked with a Subscribe button.
- `/dashboard/campaigns/new` — **numbers-only**: shows the assigned
  from-number before starting; paste or upload (.csv/.txt), live valid
  count, invalid numbers flagged (missing country code / too short),
  consent checkbox, **Start Calling**.
- `/dashboard/live` — one-by-one calling simulation: header shows
  **"Calling from:"** the customer's assigned number; queue by phone number,
  Pending → Calling → Completed/No Answer/Failed, streaming transcript,
  progress bar, Pause/Stop; every finished call produces a summary.
- `/dashboard/results` — **Call Results**: totals header + table (#, phone,
  status, duration, outcome, summary, expandable transcript) + a working
  **Export CSV** download.
- `/dashboard/billing` — active subscription (incl. assigned caller number
  and minutes allocated / used / remaining), minutes bar, wallet + demo
  top-up, plan cards, Paddle payment history.
- `/api/calls/start` — server route that places a real ElevenLabs outbound
  call when configured (API key never reaches the browser).
- `/api/provision` — server route called when a subscription activates:
  buys/assigns the customer's caller number via Twilio and allocates his
  plan's minutes (demo number + plan minutes when Twilio is not configured).

## Demo mode (honest by design)

With no environment variables set, the app runs in clearly-labelled
**DEMO mode**: auth is a demo login (any email/password, session in
localStorage), checkout is a demo modal ("Paddle sandbox in production"),
and calls are a realistic simulation with deterministic per-number results.
Nothing pretends to be real — badges say so on every relevant screen.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build / type check
```

## Environment / going live

Copy `.env.example` to `.env.local` and fill in what you have — each
integration activates independently:

| Integration | Variables | What changes when set |
|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Real accounts + database (run `supabase/schema.sql` first) |
| ElevenLabs | `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID_DISPATCHER`, `ELEVENLABS_AGENT_ID_BRAND`, `ELEVENLABS_AGENT_PHONE_NUMBER_ID` | `/api/calls/start` places real calls via the Twilio number imported into ElevenLabs |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | `/api/provision` buys a dedicated number per subscriber at subscription time (assigned to his workspace, imported into ElevenLabs); all his calls go from that number |
| Paddle | `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` | Real checkout + webhooks activate subscriptions (create one Paddle product/price per agent × plan) |

Server-side secrets are only ever read in route handlers / integration
modules — never in client components.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Vercel → New Project → import the repo (framework auto-detects Next.js).
3. Add the environment variables above under Project → Settings →
   Environment Variables.
4. Deploy. Set `NEXT_PUBLIC_APP_URL` to the production URL afterwards.

## Project structure

```
app/                     # Next.js App Router pages
  page.tsx               # public home
  subscribe/[agentSlug]/ # create account + pay (step 2)
  login/                 # step 3
  dashboard/             # step 4: home, agents, campaigns/new, live, results, billing
  api/calls/start/       # server route → ElevenLabs outbound call
  api/provision/         # server route → Twilio number provisioning on subscription
components/              # DemoProvider (demo state store), public header/footer
lib/
  data.ts                # the two agents, plans, workflow steps
  phone.ts               # number parsing/validation + demo caller numbers
  provisioning.ts        # assigned-number/minutes view helper (Step 3b)
  simulation.ts          # demo call scenarios, summaries, transcripts
  config.ts              # env config (public vs server-only)
  integrations/          # paddle.ts · elevenlabs.ts · twilio.ts · supabase.ts (typed seams)
supabase/schema.sql      # production database schema + RLS notes
```
