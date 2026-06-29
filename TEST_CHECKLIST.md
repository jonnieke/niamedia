# End-to-End Test Checklist — Nia Media MVP

**Purpose**: Verify all features work after deployment  
**Time**: ~30 min per user flow  
**Environment**: Staging or production after migrations/functions deployed

---

## Pre-Test Setup
- [ ] Database migrations applied (`npx supabase db push --linked`)
- [ ] All edge functions deployed (via Supabase CLI or dashboard)
- [ ] Frontend live on Vercel (or `npm run dev` locally)
- [ ] Browser: clear cache, use incognito window
- [ ] Create 2 test accounts: `testuser1@test.com`, `testuser2@test.com`

---

## Flow 1: Free Tier Onboarding + Limit

### Sign Up & Onboarding
- [ ] Go to `/` (home page)
- [ ] Click "Generate Free Campaign" or "Start on WhatsApp"
- [ ] Register as new user
- [ ] Complete onboarding: Business Name → Industry → First Goal
- [ ] Verify Brand Kit saved (click Brand Kit, see data)

### Free Tier Campaign Limit
- [ ] Go to `/new-campaign`, fill brief, click "Generate"
- [ ] **Expect**: Campaign generates, 1 credit deducted (or free campaign used if free tier)
- [ ] Check Dashboard: "1 campaign" showing
- [ ] Try to generate 2nd campaign
- [ ] **Expect**: Either "Upgrade to unlock" overlay (if free tier) OR insufficient credits error (if paid)

### Paid Upgrade
- [ ] Click "Upgrade" or go to `/pricing`
- [ ] Select "Growth Monthly" (KES 2,500)
- [ ] Complete PesaPal payment
- [ ] **Expect**: Redirect to dashboard, credits updated, can now generate unlimited campaigns

**Status**: ✅ / ❌

---

## Flow 2: Brand Memory Feed

### Set Up Brand Kit
- [ ] Go to `/brand-kit`
- [ ] Fill **Brand Memory** card:
  - Common offers: "Free delivery over KES 2,000"
  - Key selling points: "Fast, trusted, Nairobi-wide"
  - Customer objections: "Is it legit? How fast?"
  - Competitors: "FastFood Delivery Co"
  - Words to use: "fresh, quick, reliable"
  - Words to avoid: "cheap, slow"
- [ ] Save Brand Kit

### Generate Campaign with Brand Memory
- [ ] Go to `/new-campaign`, fill brief
- [ ] Click "Generate"
- [ ] **Expect**: Campaign copy includes:
  - ✅ "Fresh" or "quick" (words_to_use)
  - ❌ NOT "cheap" (words_to_avoid)
  - ✅ Addresses objections (e.g., "trusted since 2020")
  - ✅ Uses "free delivery" offer

**Status**: ✅ / ❌

---

## Flow 3: Ideas Bank + Creative Assistant

### Brainstorm with Nia
- [ ] Dashboard: Click "Ask Nia Creative"
- [ ] Chat: "Give me an idea for a KES 5K food delivery offer in Nairobi"
- [ ] **Expect**: Nia suggests campaign angle + structured idea card appears
- [ ] Click "Save to Ideas Bank"
- [ ] **Expect**: Redirect to `/ideas`, idea appears in list

### Convert Idea to Campaign
- [ ] Go to `/ideas`
- [ ] Click "Campaign" on saved idea
- [ ] **Expect**: Redirected to `/new-campaign` with fields pre-filled (product, audience, etc.)
- [ ] Click "Generate"
- [ ] **Expect**: Campaign generated, now in Campaigns list

### Ideas Bank Filters
- [ ] Go to `/ideas`
- [ ] Filter by status: Draft, Selected, In Campaign, Archived
- [ ] **Expect**: List updates correctly
- [ ] Click favorite ❤️ on one
- [ ] **Expect**: Moves to top

**Status**: ✅ / ❌

---

## Flow 4: Campaign Results + One-Click Actions

### Generate Campaign
- [ ] `/new-campaign`, fill brief, generate

### One-Click Refine Actions
- [ ] Go to "Video Script" tab
- [ ] Click "Shorter" button
- [ ] **Expect**: Script re-written, shorter, within 2 sec
- [ ] Click "More emotional"
- [ ] **Expect**: Script re-written, emotional tone, within 2 sec
- [ ] Click "Kiswahili"
- [ ] **Expect**: Script in Kiswahili, within 2 sec
- [ ] Each button has spinner (not blocking others)

### Language Modes
- [ ] Go to `/new-campaign`
- [ ] Click "Sheng-light" language pill
- [ ] Fill brief, generate
- [ ] **Expect**: Copy feels current, street-smart, but clear
- [ ] Repeat with "Mixed EN/SW"
- [ ] **Expect**: Natural code-switching (e.g., "Fresh supplies, sub 30 mins — haraka!")

### YouTube Shorts + Calendar + Follow-Ups
- [ ] CampaignResults: Go to "Video Script" tab
- [ ] **Expect**: YouTube Shorts section visible (hook, script, caption)
- [ ] Go to "7-Day Calendar" tab
- [ ] **Expect**: 7 rows with day/platform/format/idea/caption
- [ ] Go to "Follow-Ups" tab
- [ ] **Expect**: 3 WhatsApp-ready messages (gentle nudge, value, close)

### Premium Feature Gates
- [ ] Free tier user goes to "7-Day Calendar" tab
- [ ] **Expect**: "Upgrade to unlock" overlay + link to /pricing
- [ ] Same for "Follow-Ups" tab

**Status**: ✅ / ❌

---

## Flow 5: Lead Tracker + Admin Visibility

### User: Add Leads
- [ ] Go to `/leads`
- [ ] Click "Add Lead"
- [ ] Fill: Name, Phone, Source (WhatsApp), Interest (Warm), Status (New)
- [ ] Save
- [ ] **Expect**: Lead appears in list, performance metrics update (Total, Conversion %)

### User: Change Lead Status
- [ ] Click lead status dropdown
- [ ] Change to "Interested"
- [ ] **Expect**: Status updates, color changes

### Dashboard: Lead Metrics
- [ ] Go to Dashboard
- [ ] Right sidebar: Leads summary card
- [ ] **Expect**: Shows "Total leads", "Conversion %", "Open pipeline (KES)", "Revenue won (KES)"

### Admin: View All Campaign Leads
- [ ] Go to `/admin` (admin user only)
- [ ] Click "Leads" tab
- [ ] **Expect**: Campaign Leads section shows all users' leads
- [ ] Filter by source: WhatsApp
- [ ] **Expect**: Only WhatsApp leads show
- [ ] Filter by status: Interested
- [ ] **Expect**: Only Interested leads show

**Status**: ✅ / ❌

---

## Flow 6: Campaign Analytics + Share Tracking

### Share Campaign
- [ ] CampaignResults: Click "Open in WhatsApp" on a section (e.g., WhatsApp Message tab)
- [ ] **Expect**: WhatsApp opens with message pre-filled
- [ ] Go back to CampaignResults
- [ ] Select all text, copy "Share on WhatsApp" link (or API call in background)
- [ ] **Expect**: Gets tracking link like `niamedia.co.ke/track/{token}`

### Track Share View
- [ ] Open tracking link in new incognito window
- [ ] **Expect**: Redirects to `/campaigns/{id}`, logs view event
- [ ] Go back to campaign (logged-in user)
- [ ] Check campaign_shares table (Supabase dashboard) or future dashboard analytics
- [ ] **Expect**: views counter incremented (1+)

### Verify Immutable Log
- [ ] Supabase: Check `share_events` table
- [ ] **Expect**: Row added with event_type='view', IP, user_agent, referrer

**Status**: ✅ / ❌

---

## Flow 7: WhatsApp Bot Onboarding

### Send Message to Bot
- [ ] Click "Start on WhatsApp" on home page (or `wa.me` link)
- [ ] **Expect**: WhatsApp opens with chat to bot number
- [ ] Type: "Create my first campaign"

### Multi-Turn Conversation
- [ ] Bot: "What's the name of your business?"
- [ ] You: "Pizza Palace"
- [ ] Bot: "Got it! Business: Pizza Palace. What product or service are you promoting?"
- [ ] Continue filling: product, audience, objective, tone
- [ ] After tone: Bot: "✨ Generating your campaign..."

### Campaign Delivery
- [ ] **Expect**: Bot sends back campaign copy (WhatsApp Message + Poster Copy sections)
- [ ] Copy is in Swahili (SW is default for unauthenticated users)

**Status**: ✅ / ❌

---

## Flow 8: Admin Operations

### View Campaign Leads
- [ ] Admin: `/admin` → Leads tab
- [ ] See "Campaign Leads — User Pipeline" section
- [ ] See stats: New / Contacted / Interested / Converted / Lost counts
- [ ] Filter by source + status
- [ ] **Expect**: Leads shown with name, user, source, interest, value, status, date

### View Service Requests
- [ ] Admin: Leads tab (scroll down)
- [ ] See "Service Requests — Creative Production Leads" section
- [ ] See existing package requests (audio orders, projects)

**Status**: ✅ / ❌

---

## Flow 9: Authentication & Security

### Sign Up (Email Verification)
- [ ] Register new account
- [ ] **Expect**: Verification email sent (check email or test email service)
- [ ] Click verify link
- [ ] **Expect**: Redirected to onboarding, account active

### Password Reset
- [ ] Logout
- [ ] Click "Forgot password"
- [ ] Enter email
- [ ] **Expect**: Reset link sent
- [ ] Click link
- [ ] **Expect**: Can set new password, login with new password

### RLS Policies
- [ ] Logged in as User A
- [ ] Try to access User B's campaign (direct URL navigation)
- [ ] **Expect**: 404 or redirect to Dashboard (not User B's data)

**Status**: ✅ / ❌

---

## Flow 10: Pricing & Payment

### View Pricing
- [ ] Go to `/pricing`
- [ ] **Expect**: 3 cards: Campaign Credits, Growth Monthly, Business Monthly, Managed tiers
- [ ] **Expect**: NO "Unlimited" language anywhere
- [ ] Business Monthly: "40 campaigns/month, KES 150 each extra"

### Buy Credits
- [ ] Go to `/pricing`, click "Get 5 credits"
- [ ] **Expect**: PesaPal payment gateway opens
- [ ] Complete test payment (use PesaPal sandbox)
- [ ] **Expect**: Redirect to dashboard, credits balance updated

### Monthly Subscription
- [ ] Click "Growth Monthly (KES 2,500)"
- [ ] Complete payment
- [ ] **Expect**: Unlimited campaigns available, all premium features unlocked

**Status**: ✅ / ❌

---

## Edge Cases & Error Handling

### No Credits
- [ ] Create free tier user
- [ ] Try to generate campaign after using 1 free
- [ ] **Expect**: "Upgrade" message, no crash

### Bad Input
- [ ] NewCampaign: Leave business_name blank, click Generate
- [ ] **Expect**: Validation error, user-friendly message

### Network Error
- [ ] Simulate offline (DevTools → Network → Offline)
- [ ] Try to generate campaign
- [ ] **Expect**: Graceful error message, option to retry

### Function Timeout
- [ ] Generate campaign
- [ ] Wait (some functions take 20–30 sec)
- [ ] **Expect**: No timeout error, completion happens within 60 sec

**Status**: ✅ / ❌

---

## Performance Checks

### Page Load Time
- [ ] `/campaigns` with 10+ campaigns
- [ ] **Expect**: < 3 sec (lazy load)
- [ ] `/leads` with 50+ leads
- [ ] **Expect**: < 2 sec (paginated or virtualized)

### Generation Speed
- [ ] Click "Generate"
- [ ] **Expect**: Streaming response starts within 2–3 sec
- [ ] Full response within 15–20 sec

### Mobile Responsiveness
- [ ] DevTools: iPhone 12 viewport
- [ ] Navigate all pages
- [ ] **Expect**: Layout responsive, no horizontal scroll, buttons clickable

**Status**: ✅ / ❌

---

## Browser Compatibility

- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Firefox

**Status**: ✅ / ❌

---

## Final Sign-Off

**Tester Name**: _______________  
**Date**: _______________  
**Environment**: Staging / Production  
**Overall Status**: ✅ PASS / ❌ FAIL / ⚠️ PASS WITH NOTES

**Notes & Issues Found**:
```
1. 
2. 
3. 
```

**Sign Off**: 
- [ ] All flows tested
- [ ] No blocking bugs found
- [ ] Ready to ship

---

**Next**: If all green → announce launch, send to beta users.
