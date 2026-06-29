# Deployment Guide — Nia Media MVP

## Status
- **Frontend**: Pushed to `main` branch → Auto-deploying via Vercel ✅
- **Backend**: Ready to deploy (migrations + edge functions)

## Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref <your-project-ref>

# (Optional) Set local DB password for migrations
export SUPABASE_DB_PASSWORD=<your-db-password>
```

## Deployment Steps

### 1. Deploy Database Migrations
```bash
cd D:/nia media
npx supabase db push --linked
```

This will apply 5 migrations in order:
- `20260625000001_credit_reserve_commit.sql` — Credit system (reserve/commit/refund)
- `20260625000002_ideas_and_assistant.sql` — Ideas Bank + Creative Assistant
- `20260625000003_brand_memory_and_leads.sql` — Brand Memory + Lead Tracker
- `20260629000004_free_tier.sql` — Free tier + WhatsApp sessions
- `20260629000005_campaign_analytics.sql` — Campaign shares + tracking

**Status after migrations:**
- ✅ All tables created with RLS policies
- ✅ RPCs available (reserve_credit, commit_credit, refund_credit, increment_share_counter)
- ✅ Database is production-ready

### 2. Deploy Edge Functions
Deploy in this order (all require `--no-verify-jwt` for service-role anon calls):

```bash
# Core campaign generation (feeds Brand Memory, enforces free tier)
npx supabase functions deploy generate-campaign --no-verify-jwt

# Creative Assistant (Nia brainstorming)
npx supabase functions deploy creative-assistant --no-verify-jwt

# WhatsApp bot (multi-turn brief collection)
npx supabase functions deploy whatsapp-brief-bot --no-verify-jwt

# Per-section AI refine (one-click actions)
npx supabase functions deploy refine-section --no-verify-jwt

# Share tracking (log views/clicks on shared campaigns)
npx supabase functions deploy track-share --no-verify-jwt

# CORS-migrated functions (16 total — redeploy to pick up shared cors.ts)
npx supabase functions deploy buy-credits --no-verify-jwt
npx supabase functions deploy chat-agent --no-verify-jwt
npx supabase functions deploy clone-voice --no-verify-jwt
npx supabase functions deploy generate-brief --no-verify-jwt
npx supabase functions deploy generate-concept --no-verify-jwt
npx supabase functions deploy pesapal-checkout --no-verify-jwt
npx supabase functions deploy voice-preview --no-verify-jwt
npx supabase functions deploy notify-admin --no-verify-jwt
npx supabase functions deploy pesapal-ipn --no-verify-jwt
npx supabase functions deploy send-welcome-sequence --no-verify-jwt
npx supabase functions deploy process-email-queue --no-verify-jwt
npx supabase functions deploy generate-poster --no-verify-jwt
# ... (add any others)
```

**Status after functions:**
- ✅ All edge functions running
- ✅ Credit system operational
- ✅ WhatsApp bot ready to receive messages
- ✅ Share tracking active

### 3. Frontend
- Already deployed to Vercel (auto on `git push main`)
- Check deployment status: https://vercel.com/dashboard

---

## Testing Checklist

### User Flow
- [ ] **Sign up** → Onboarding (Brand Kit)
- [ ] **Free tier test** — Generate 1 campaign (free), attempt 2nd (blocked with "upgrade" message)
- [ ] **WhatsApp bot** — Send message to wa.me link, complete multi-turn brief, receive campaign via WhatsApp
- [ ] **Brand Memory** — Add Brand Kit, generate campaign, verify copy honors words-to-use/avoid
- [ ] **Ideas Bank** — Save idea, convert to campaign
- [ ] **Lead Tracker** — Add lead, change status, see metrics on Dashboard
- [ ] **Campaign Results** — One-click Shorter/Emotional/Direct/Kiswahili actions
- [ ] **Language modes** — Generate in Sheng, Mixed, Conversational
- [ ] **Admin page** — View all campaign leads, filter by source/status

### Analytics
- [ ] **Share link** — Click share button → get tracking link → verify `/track/:token` redirects
- [ ] **View tracking** — Share link shows view count on campaign_shares

### Edge Cases
- [ ] Credit reserve → generation failure → credit refunded (check profiles.credits)
- [ ] Free tier user tries Calendar/Follow-ups tabs → "Upgrade" overlay appears
- [ ] Brand Memory fields blank → generation still works (no required fields)

---

## Post-Deploy Checklist

### Configuration
- [ ] Set `ALLOWED_ORIGINS` env var on Supabase (comma-separated: `https://niamedia.co.ke,https://www.niamedia.co.ke,http://localhost:5173`)
- [ ] Update WhatsApp bot phone number in Home page (currently placeholder)
- [ ] Set up WhatsApp Business Account integration (currently Supabase URL + manual testing only)

### Monitoring
- [ ] Check Vercel logs for deployment errors
- [ ] Check Supabase edge function logs for runtime errors
- [ ] Monitor database usage (credit transactions, new users, leads)

### Data Cleanup
- [ ] Delete test users/campaigns if needed
- [ ] Verify no sensitive data in logs

---

## Rollback Plan

If something breaks:

1. **Frontend rollback**: Revert commit on `main`, push to trigger Vercel re-deploy
2. **Function rollback**: Redeploy previous version or disable function (Supabase dashboard)
3. **Database rollback**: Manual SQL via Supabase dashboard (reverse migrations if needed)

---

## Support

For issues:
- Check `supabase functions list` to verify all functions deployed
- Check Supabase dashboard → Edge Functions → Logs
- Check Vercel dashboard → Deployments & Logs
- Check browser console for client-side errors

---

## Next Steps After Deploy

1. **Smoke test** all features above
2. **Monitor analytics** (Vercel + Supabase logs) for first 24h
3. **Share with beta testers** (team, early customers)
4. **Iterate** based on feedback

---

## Appendix: Environment Variables

### Supabase (already set)
- `SUPABASE_URL` — Project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Service role for RPCs
- `VITE_SUPABASE_URL` — Frontend URL
- `VITE_SUPABASE_ANON_KEY` — Frontend anon key

### Optional (for full integration)
- `ALLOWED_ORIGINS` — CORS whitelist
- `FALAI_API_KEY` — Poster generation (fal.ai)
- `RESEND_API_KEY` — Email sending
- `PESAPAL_CONSUMER_KEY` / `PESAPAL_CONSUMER_SECRET` — Payments
- `ANTHROPIC_API_KEY` — Claude API

---

Last updated: 2026-06-29
