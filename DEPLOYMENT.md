# Nia Media — Production Deployment Playbook

> Last updated: 2026-07-04 · Phases 1–30 complete

---

## Overview

| Layer | Host | Deploy trigger |
|---|---|---|
| Frontend (React/Vite) | Vercel | `git push main` (auto) |
| Database (PostgreSQL) | Supabase | `npx supabase db push --linked` |
| Edge Functions (Deno) | Supabase | `npx supabase functions deploy <name>` |
| Cron jobs | pg_cron (Supabase) | Applied via migrations |

---

## 1 · Prerequisites

```powershell
# Install Supabase CLI (once)
npm install -g supabase

# Log in
npx supabase login

# Link to the Nia Media project
npx supabase link --project-ref toeanytckprebwuxgkcd
```

---

## 2 · Database Migrations

```powershell
cd "D:\nia media"
npx supabase db push --linked
```

Answer **y** when prompted. All migrations are idempotent — safe to re-run.

### What gets applied
| File | Contents |
|---|---|
| `20250610000001` | PesaPal audio orders |
| `20250610000002` | Voice cloning |
| `20250620000002` | Conversation sessions |
| `20250620000003` | Credits system |
| `20250620000004` | Email queue |
| `20260621000001` | Demo rate limits |
| `20260621000002` | Referrals |
| `20260621000003` | Email opt-out |
| `20260622000001` | Brand kit industry field |
| `20260625000001` | Credit reserve/commit/refund |
| `20260625000002` | Ideas Bank + Creative Assistant |
| `20260625000003` | Brand Memory + Lead Tracker |
| `20260629000004` | Free tier |
| `20260629000005` | Campaign analytics (shares) |
| `20260630000007` | Demo rate limits v2 |
| `20260630000008` | Campaign docs bucket |
| `20260630000009` | Leads email field |
| `20260630000010` | Lead follow-ups |
| `20260630000011` | Campaign reviews |
| `20260630000012` | Push subscriptions |
| `20260630000013` | Subscription plans |
| `20260630000014` | WhatsApp broadcasts + Content calendar |
| `20260630000015` | Team workspace + invites |
| `20260630000016` | Campaign template library |
| `20260630000017` | Weekly reports + pg_cron schedule |
| `20260630000018` | Social publisher, WhatsApp AI, Client portals |
| `20260704000001` | Invoices, Video pipeline, ROI tracker |
| `20260704000002` | Quote requests |
| `20260704000003` | Proposals |
| `20260704000004` | AI Video briefs |
| `20260704000005` | Portfolio items |
| `20260704000006` | Projects (production board) |
| `20260704000007` | Client testimonials |
| `20260704000008` | In-app notifications + notify_admins() |
| `20260704000009` | Proposal follow-up columns |
| `20260704000010` | Monthly retainers |
| `20260704000011` | Retainer auto-billing cron (pg_cron) |
| `20260704000012` | Client intake forms |

### pg_cron jobs (applied automatically by migrations)
| Job | Schedule | Function |
|---|---|---|
| `send-weekly-reports` | Mondays 07:00 EAT | `send-weekly-reports` |
| `publish-scheduled-posts` | Every 15 minutes | `schedule-posts` |
| `bill-retainers-daily` | Daily 07:00 EAT | `bill-retainers` |

---

## 3 · Supabase Secrets

Set all secrets **before** deploying edge functions:

```powershell
npx supabase secrets set `
  ANTHROPIC_API_KEY="sk-ant-..." `
  RESEND_API_KEY="re_..." `
  FALAI_API_KEY="..." `
  PESAPAL_CONSUMER_KEY="..." `
  PESAPAL_CONSUMER_SECRET="..." `
  PESAPAL_ENV="production" `
  APP_URL="https://niamedia.co.ke" `
  ALLOWED_ORIGINS="https://niamedia.co.ke,https://www.niamedia.co.ke" `
  ELEVENLABS_API_KEY="..." `
  GEMINI_API_KEY="..."
```

> **Already set** (do not overwrite unless rotating):
> `RESEND_API_KEY` ✅ · `APP_URL` ✅

### Secret reference

| Secret | Required by | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `generate-campaign`, `creative-assistant`, `refine-section`, `generate-video-brief`, `chat-agent`, `nia-wizard`, `whatsapp-webhook` | Claude Sonnet / Haiku |
| `RESEND_API_KEY` | `send-client-email`, `send-welcome-sequence`, `process-email-queue`, `send-weekly-reports` | FROM: hello@niamedia.co.ke |
| `FALAI_API_KEY` | `generate-poster`, `generate-style-thumb` | fal.ai Flux Schnell |
| `PESAPAL_CONSUMER_KEY` | `pesapal-checkout`, `pesapal-ipn` | PesaPal v3 production |
| `PESAPAL_CONSUMER_SECRET` | `pesapal-checkout`, `pesapal-ipn` | PesaPal v3 production |
| `PESAPAL_ENV` | `pesapal-checkout` | Set to `production` |
| `APP_URL` | `send-client-email`, `generate-video-brief` | `https://niamedia.co.ke` |
| `ALLOWED_ORIGINS` | All CORS functions | Comma-separated allowed origins |
| `ELEVENLABS_API_KEY` | `voice-preview`, `clone-voice`, `chat-agent` | ElevenLabs TTS + cloning |
| `GEMINI_API_KEY` | `gemini-live-token`, `test-gemini` | Google Gemini |
| `SUPABASE_URL` | All edge functions | Auto-injected by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | All edge functions | Auto-injected by Supabase |
| `SUPABASE_ANON_KEY` | All edge functions | Auto-injected by Supabase |

### Vercel environment variables
Set in Vercel dashboard → Project Settings → Environment Variables:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://toeanytckprebwuxgkcd.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_CAL_BOOKING_URL` | Cal.com general booking link |
| `VITE_CAL_BOOKING_URL_VIDEO` | Cal.com video briefing link |
| `VITE_CAL_BOOKING_URL_CAMPAIGN` | Cal.com campaign strategy link |
| `VITE_CAL_BOOKING_URL_CONSULTATION` | Cal.com consultation link |
| `VITE_CAL_BOOKING_URL_URGENT` | Cal.com urgent/same-day link |

---

## 4 · Edge Functions Deploy

Run the deploy script (Windows PowerShell):

```powershell
.\deploy-functions.ps1
```

Or deploy individually:

```powershell
npx supabase functions deploy <function-name> --no-verify-jwt
```

### Complete function list (47 functions)

#### AI & Campaign Generation
```powershell
npx supabase functions deploy generate-campaign --no-verify-jwt
npx supabase functions deploy creative-assistant --no-verify-jwt
npx supabase functions deploy refine-section --no-verify-jwt
npx supabase functions deploy remix-campaign --no-verify-jwt
npx supabase functions deploy generate-concept --no-verify-jwt
npx supabase functions deploy generate-brief --no-verify-jwt
npx supabase functions deploy generate-poster --no-verify-jwt
npx supabase functions deploy generate-style-thumb --no-verify-jwt
npx supabase functions deploy generate-calendar --no-verify-jwt
npx supabase functions deploy generate-schedule --no-verify-jwt
npx supabase functions deploy generate-report --no-verify-jwt
npx supabase functions deploy generate-video-brief --no-verify-jwt
npx supabase functions deploy campaign-research --no-verify-jwt
npx supabase functions deploy parse-document --no-verify-jwt
npx supabase functions deploy research-url --no-verify-jwt
```

#### Nia AI Agent
```powershell
npx supabase functions deploy chat-agent --no-verify-jwt
npx supabase functions deploy nia-wizard --no-verify-jwt
npx supabase functions deploy gemini-live-token --no-verify-jwt
```

#### Voice & Audio
```powershell
npx supabase functions deploy voice-preview --no-verify-jwt
npx supabase functions deploy clone-voice --no-verify-jwt
```

#### Payments
```powershell
npx supabase functions deploy buy-credits --no-verify-jwt
npx supabase functions deploy pesapal-checkout --no-verify-jwt
npx supabase functions deploy pesapal-ipn --no-verify-jwt
npx supabase functions deploy mpesa-payment --no-verify-jwt
```

#### Email & Notifications
```powershell
npx supabase functions deploy send-client-email --no-verify-jwt
npx supabase functions deploy send-welcome-sequence --no-verify-jwt
npx supabase functions deploy process-email-queue --no-verify-jwt
npx supabase functions deploy send-weekly-reports --no-verify-jwt
npx supabase functions deploy notify-admin --no-verify-jwt
npx supabase functions deploy notify-video-request --no-verify-jwt
npx supabase functions deploy notify-video-status --no-verify-jwt
npx supabase functions deploy send-push-notification --no-verify-jwt
npx supabase functions deploy save-push-subscription --no-verify-jwt
```

#### WhatsApp & Social
```powershell
npx supabase functions deploy whatsapp-webhook --no-verify-jwt
npx supabase functions deploy whatsapp-brief-bot --no-verify-jwt
npx supabase functions deploy send-broadcast --no-verify-jwt
npx supabase functions deploy capture-lead --no-verify-jwt
npx supabase functions deploy facebook-oauth --no-verify-jwt
npx supabase functions deploy publish-post --no-verify-jwt
npx supabase functions deploy schedule-posts --no-verify-jwt
```

#### Analytics & Reviews
```powershell
npx supabase functions deploy track-share --no-verify-jwt
npx supabase functions deploy get-shared-campaign --no-verify-jwt
npx supabase functions deploy submit-review --no-verify-jwt
npx supabase functions deploy get-campaign-review --no-verify-jwt
```

#### Leads & Follow-ups
```powershell
npx supabase functions deploy schedule-follow-ups --no-verify-jwt
npx supabase functions deploy process-follow-ups --no-verify-jwt
```

#### Retainer Billing (Cron)
```powershell
npx supabase functions deploy bill-retainers --no-verify-jwt
```

---

## 5 · Manual Supabase Dashboard Steps

These cannot be scripted — do them once in the Supabase dashboard:

- [ ] **Auth → URL Configuration**
  - Site URL: `https://niamedia.co.ke`
  - Redirect URLs: add `https://niamedia.co.ke/reset-password`

- [ ] **Storage → New bucket**
  - Name: `voice-samples`
  - Public: **No** (private)
  - RLS: users can upload/read their own files

- [ ] **Auth → Providers** (optional)
  - Enable Google OAuth if desired (requires Google Cloud Console setup)

- [ ] **Database → Extensions** — confirm these are enabled:
  - `pg_cron` ✅
  - `pg_net` ✅ (for cron → HTTP calls)
  - `pgcrypto` / `extensions` ✅ (for `gen_random_bytes`)

---

## 6 · PesaPal IPN Configuration

In PesaPal merchant dashboard:
- IPN URL: `https://toeanytckprebwuxgkcd.supabase.co/functions/v1/pesapal-ipn`
- Method: POST
- Notification type: JSON

**Order ID prefix routing in `pesapal-ipn`:**
| Prefix | Routes to |
|---|---|
| `cred_` | Credit top-up → add credits to profile |
| `inv_` | Invoice payment → mark invoice paid |
| `prop_` | Proposal deposit → mark proposal paid, notify admin |
| `proj_` | Project balance → mark project paid, notify admin |
| *(audio)* | Audio order → mark order paid |

---

## 7 · First Admin User

After the first user registers, promote them to admin via Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'kariukinjoroge13@gmail.com';
```

---

## 8 · Post-Deploy Smoke Tests

### Critical path (in order)
- [ ] `/` — homepage loads, demo campaign generates
- [ ] `/start` — client intake form submits, admin notification fires
- [ ] `/register` → `/onboarding` — user created, brand kit saved
- [ ] `/new-campaign` — campaign generates, credits deducted
- [ ] `/quote` — quote calculates and submits
- [ ] `/admin` — loads for admin user, shows tabs
- [ ] `/admin/analytics` — revenue analytics page loads
- [ ] `/proposals` — list loads, create/edit/send works
- [ ] `/proposal/:token` — public view, PesaPal deposit flow
- [ ] `/brief/:token` — public view, approve/request revision
- [ ] `/production` — production board, stage transitions
- [ ] `/delivery/:token` — public delivery view, M-Pesa balance payment
- [ ] `/retainers` — list, create, Bill Now creates proposal
- [ ] `/start` — 4-step intake form, confirmation screen

### Payment flow
- [ ] Create a proposal → client visits `/proposal/:token` → pays deposit → IPN fires → proposal marked `paid` → admin notified
- [ ] Production board → "Notify & Deliver" → client visits `/delivery/:token` → pays balance → IPN fires (`proj_` prefix) → project marked complete

### Email flow
- [ ] Register → receive welcome email (Resend)
- [ ] Proposal sent → client receives proposal email
- [ ] Brief ready → client receives brief email
- [ ] Video delivered → client receives delivery email

---

## 9 · Deploy Script (PowerShell)

See `deploy-functions.ps1` in the project root — runs all 47 function deploys sequentially with progress output.

---

## 10 · Rollback

| Layer | Action |
|---|---|
| Frontend | Revert commit on `main` → Vercel auto-redeploys |
| Edge function | `npx supabase functions deploy <name> --no-verify-jwt` (previous version from git) |
| Migration | Manual SQL rollback via Supabase SQL editor (migrations are not auto-reversible) |

---

## Appendix: Revenue Stream Summary

| Stream | Table | Payment | Order prefix |
|---|---|---|---|
| Video proposals | `proposals` | PesaPal | `prop_` |
| Project balance | `projects` | PesaPal | `proj_` |
| Audio orders | `audio_orders` | PesaPal | *(no prefix)* |
| AI credits | `credit_transactions` | PesaPal | `cred_` |
| Monthly retainers | `retainers` → `proposals` | PesaPal via proposal | `prop_` |
| Invoices | `invoices` | PesaPal | `inv_` |
