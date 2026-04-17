# Resvio — Product Scaling Roadmap

> From solo-user NAS tool to a fully monetised, multi-user European SaaS

---

## Executive Summary

Resvio is already functionally solid: job aggregation from 6+ sources, AI CV tailoring, application tracking, and a subscription model skeleton. The gap between "working for one person" and "earning €5k MRR" is not features — it is infrastructure, auth, payments, and distribution. This document maps every step required, in the correct order.

---

## Phase 0 — Foundation (Must complete before any marketing)

These are blocking issues. Nothing else matters until these are resolved.

### 0.1 Multi-User Authentication

**Current state:** `profile.json` is a single flat file. One user. No login. Basic-auth password protects the entire app.

**What to do:**
1. Integrate **Supabase** (free tier covers ~50k MAU). Supabase gives you: Postgres DB, auth (email/password + Google OAuth + LinkedIn OAuth), row-level security, file storage for CVs.
2. Replace `ProfileService.getProfile()` / `saveProfile()` with Supabase calls authenticated per user.
3. Remove `middleware.ts` Basic Auth once proper login exists.
4. Migrate `data/profile.json` schema to a `profiles` table in Supabase.

**Supabase schema:**
```sql
profiles (
  id uuid references auth.users primary key,
  name text,
  email text,
  phone text,
  base_cv text,
  portfolio_url text,
  skills text[],
  subscription_plan text default 'free',
  cv_credits int default 3,
  subscription_activated_at timestamptz,
  subscription_expires_at timestamptz,
  created_at timestamptz default now()
)

applied_jobs (
  id uuid primary key,
  user_id uuid references profiles,
  job_id text,
  job_title text,
  company text,
  applied_at timestamptz,
  status text default 'applied',
  notes text
)

generated_cvs (
  id uuid primary key,
  user_id uuid references profiles,
  job_id text,
  cv_markdown text,
  template_id text,
  created_at timestamptz default now()
)
```

**Effort:** ~3 days  
**Unlocks:** Everything else. Without auth, you cannot charge anyone.

---

### 0.2 Stripe Payment Integration

**Current state:** Prices are on the landing page. No checkout exists. `activatePlan()` is a stub.

**What to do:**
1. Create a Stripe account (EU entity — use Polish tax ID if you have one, otherwise use Stripe Atlas for a proper setup).
2. Create 3 Stripe Products: Starter (€3.99), Growth (€8.99), Pro (€12.99). Use **one-time payments** initially (not subscriptions) since your model is credit-based, not monthly access.
3. Add `/api/checkout` route that creates a Stripe Checkout Session.
4. Add `/api/webhooks/stripe` route that handles `checkout.session.completed` → calls `SubscriptionService.activatePlan()` with the actual Supabase user ID.
5. Add "Buy Credits" buttons to the profile page and to the "no credits remaining" modal.

**Key Stripe decisions:**
- **One-time credit packs** are simpler to implement and explain than subscriptions. Sell "30 CV generations for €8.99" not "€8.99/month for 30/month".
- Add a **€0/forever Free plan** (3 credits on sign-up) — this is your acquisition tool. Never remove it.
- Consider also a monthly subscription variant at Phase 2 (€12.99/month for unlimited match scoring + 50 CVs).

**Effort:** ~2 days  
**Unlocks:** Revenue.

---

### 0.3 Move to Vercel (Production Infrastructure)

**Current state:** Running on NAS via Docker, exposed through Cloudflare Tunnel. This is fragile — NAS reboots kill the app.

**What to do:**
1. The app is already on Vercel (`applyarr.vercel.app`). Just point DNS there properly once propagation completes.
2. Set Vercel environment variables: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
3. Keep NAS as a **scraper worker** only (see Phase 1.2). The Vercel build should gracefully skip Playwright scrapers.
4. The NAS Docker instance becomes your background worker, not your web server.

**Effort:** Already mostly done. DNS propagation + env vars = 1 hour.

---

### 0.4 Fix the Scraper Architecture for Production

**Current state:** LinkedIn and Indeed use Playwright — this works locally but not on Vercel. Vercel has a 50MB function limit and no persistent browser.

**What to do:**
- Create a `/api/scrape-proxy` endpoint that calls your NAS (or a dedicated VPS scraper) via a private HTTPS endpoint.
- NAS runs a lightweight Express scraper server that accepts `{ source: 'linkedin', query: '...' }` and returns jobs.
- This separates concerns: Vercel handles UI + AI, NAS handles scraping.
- Alternatively: use **BrightData** or **Apify** (€50-150/month) for managed scraping. This eliminates the NAS dependency entirely but costs money.

**For MVP:** Redirect-based scraper. NAS scraper API → called from Vercel. Use a Cloudflare Tunnel endpoint like `https://scraper.resvio.online` (separate cloudflared service pointing at port 3001 on NAS).

---

## Phase 1 — Growth-Ready Product (Target: month 1-2)

Once auth + payments work, focus on acquiring and retaining users.

### 1.1 Onboarding Flow

**Current state:** User lands on app, no guidance, must find Profile page, must paste their CV manually.

**What to do:**
1. Add a proper 3-step onboarding wizard shown on first login:
   - Step 1: "Upload your CV (PDF or paste text)"
   - Step 2: "What country are you job hunting in?" (set default market)
   - Step 3: "Search for your first jobs" → drops to home page pre-filtered
2. Show a progress indicator: "You have 3 free CV tailors — use them to try Resvio"
3. Add a welcome email via **Resend** (free tier: 3k emails/month) triggered by Supabase auth webhook.

**Why this matters:** The biggest conversion killer is users who sign up, don't understand the value, and leave. A good onboarding shows the AI output within 2 minutes of sign-up.

---

### 1.2 CV Credits UI & Upgrade Prompts

**Current state:** Credits are deducted silently. No UI shows remaining credits. No upgrade path when credits run out.

**What to do:**
1. Show credits remaining in the sidebar: `"2 CV tailors left · Upgrade"`
2. On the apply page, show a small badge: `"3 tailors remaining (free plan)"`
3. When `canGenerateCV()` returns false, show a modal:
   - "You've used all 3 free CV tailors"
   - "Get 10 more for €3.99 · Get 30 for €8.99"
   - Stripe Checkout button
4. On the landing page, link "Get Started" to `/auth` not just `/`

---

### 1.3 Job Tracker Improvements

**Current state:** Tracker exists (`/tracker`) with status columns (applied, interview, offer, rejected). Basic functionality works.

**What to do:**
1. Add **email reminders**: "You applied to X 7 days ago — any update?" (via Resend cron)
2. Add **notes field** per application with auto-save
3. Add **drag-and-drop** between status columns (use `@hello-pangea/dnd` — 2KB)
4. Add **statistics panel**: "12 applications this month · 3 interviews · 25% interview rate"
5. Export tracker to CSV/Excel (one-click)

**Why this matters:** The tracker is a sticky feature — users who use it actively come back daily. It's the hook that prevents churn.

---

### 1.4 Multi-Language CV Generation

**Current state:** CV language is auto-detected from job description language. Polish, Swedish, English, Norwegian, Danish supported.

**What to do:**
1. Add German and Dutch to the prompt (biggest job markets you're missing)
2. Add a language override dropdown on the apply page ("Force English" option)
3. Add a "Download as DOCX" option — many Swedish employers still want Word files. Use `docx` npm package to convert the markdown.

---

### 1.5 Cover Letter Generator

**Current state:** Not implemented.

**What to do:**
1. Add a "Generate Cover Letter" button alongside "Generate CV" on the apply page
2. Reuse the same credit system (1 credit = 1 CV OR 1 cover letter — keep it simple)
3. Prompt: same job data + candidate profile → 3-paragraph professional letter in correct language
4. Add to the CV print layout as page 2 (optional)

**This is a high-value feature** — "tailored cover letter in 10 seconds" is a strong marketing hook.

---

## Phase 2 — Monetisation Optimisation (Target: month 2-4)

### 2.1 Monthly Subscription Plan

Once you have >50 paying users, add a subscription tier:

| Plan | Price | Credits | Match Scoring |
|------|-------|---------|---------------|
| Free | €0 | 3 credits, never refill | No |
| Starter | €3.99 one-time | 10 credits | No |
| Growth | €8.99 one-time | 30 credits | Yes |
| Pro Monthly | €12.99/month | 50/month, auto-refill | Yes, unlimited |

The "Pro Monthly" is your key MRR driver. Activate `AI_SCORING_PREMIUM_ONLY = true` when you have this plan live.

**Stripe Subscription implementation:**
- Create a Stripe Subscription product for Pro Monthly
- Webhook `customer.subscription.renewed` → reset `cvCredits` to 50 monthly
- Webhook `customer.subscription.deleted` → downgrade to free

---

### 2.2 LinkedIn Profile Import

**Current state:** Users must paste their CV manually.

**What to do:**
1. Add "Import from LinkedIn" button on Profile page
2. Use LinkedIn's unofficial profile export: user downloads their LinkedIn data ZIP → you parse the `Profile.csv` and `Positions.csv` files
3. Auto-populate: name, email, current title, work history, education, skills
4. This reduces onboarding friction enormously

**Alternative (simpler):** Add a LinkedIn URL field → scrape the public profile. This is legally grey but technically straightforward with Playwright.

---

### 2.3 Job Alert Emails

**What to do:**
1. User sets up an alert: "Software Engineer in Warsaw, new jobs → email me daily"
2. A Vercel Cron Job runs daily at 8am CET: fetches new jobs matching saved searches, emails matching ones via Resend
3. Email format: 5-7 job cards with "View & Apply" deep links

**Why this matters:** Job alerts bring users back passively. Every email is a free re-engagement touch.

**Implementation:**
```typescript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/job-alerts",
    "schedule": "0 7 * * *"  // 7am UTC = 8am CET
  }]
}
```

---

### 2.4 Analytics & Funnel Tracking

You need to know where users drop off. Implement before spending any money on marketing.

**What to add:**
1. **Plausible Analytics** (€9/month, GDPR-compliant, no cookie banner needed) — replace or supplement with this
2. Track custom events: `cv_generated`, `upgrade_clicked`, `checkout_started`, `checkout_completed`
3. Track: sign-up → first search → first CV generated → credit exhausted → upgrade page viewed → payment completed
4. Set up a Grafana or Plausible dashboard showing this funnel daily

**Key metrics to watch:**
- Activation rate: % users who generate ≥1 CV
- Conversion rate: % free users who buy credits
- Average Revenue Per User (ARPU)
- Churn rate (monthly plan cancellations)

---

### 2.5 Referral System

**What to do:**
1. Give every user a referral link: `resvio.online/?ref=KAMILR`
2. When a referred user buys any plan: referrer gets +5 free CV credits
3. Show referral earnings in profile: "You've earned 15 credits from referrals"

**Cost:** ~0 (credits are virtual). Value: viral growth loop.

---

## Phase 3 — Scale (Target: month 4-12)

### 3.1 Browser Extension

A Chrome/Firefox extension is the highest-ROI product investment you can make.

**What it does:**
- User browses LinkedIn, Indeed, Pracuj.pl, Finn.no in their browser
- Extension detects job listings and shows a "Generate Tailored CV" button directly on the job page
- One click → opens Resvio apply page pre-filled with that job's data
- Works around scraping limits entirely — user brings the job data to you

**Implementation:** Chrome Manifest V3 extension, background service worker, content script that reads DOM of job pages. Takes ~1 week to build.

**Distribution:** Chrome Web Store submission. This is a massive acquisition channel — searchable, free marketing.

---

### 3.2 Mobile App (React Native / Expo)

**Why:** Job searching happens on phones. A native app with push notifications ("New jobs matching your profile") drives daily engagement.

**What to build first:**
1. Job search with swipe to save/dismiss (Tinder-style, Hinge-style — fits your original redesign vision)
2. Tracker view (see your applications at a glance)
3. Push notification for job alerts
4. NOT: CV generation (complex to do on mobile, keep that on web)

**Tech stack:** Expo + React Native. Most of your existing TypeScript business logic can be reused in an `apps/mobile` monorepo package.

**Effort:** ~3-4 weeks for MVP mobile app.

---

### 3.3 Job Board Partnerships / Direct API Access

**Problem:** LinkedIn blocks scrapers. Eventually so will others.

**Solution:**
- Apply to **LinkedIn Job Search API** (free for job boards, requires LinkedIn Partnership)
- Apply to **Indeed Publisher Program** (affiliate model — you earn per click-through)
- Integrate **Adzuna API** (covers 16 countries, free tier 250 req/day)
- Integrate **Jooble API** (aggregator for Eastern Europe, free)
- Integrate **Pracuj.pl** RSS feed (Poland's biggest job board, public RSS)
- Integrate **Finn.no** API (Norway)

Each official API source = more reliable data + no scraping risk.

---

### 3.4 B2B Outplacement Tier

**What it is:** Sell Resvio to HR companies and outplacement firms to use with their clients.

**Why it works:** When a company does layoffs, they often pay for "outplacement services" — helping ex-employees find new jobs. Resvio is exactly this tool.

**How to sell it:**
- Create a B2B landing page: "Give your employees the best chance at their next role"
- Pricing: €99/month for 10 employees, €299/month for 50 employees
- Features needed: admin dashboard, bulk user creation, white-label option (custom logo)

**Sales approach:** Cold email HR directors at Swedish/Polish companies. One B2B contract = 10-50x revenue of one consumer user.

---

### 3.5 ATS Integration / Application Automation

**Current state:** "Apply" button opens a new tab with the job URL. No auto-form filling.

**Future state:**
1. For companies using **Greenhouse, Lever, Workday, BambooHR**: detect the ATS, auto-fill name/email/phone/CV
2. Track submission confirmation (email parsing via webhook)
3. Auto-update tracker when application confirmed

**Complexity:** High. These ATS platforms have captchas, login walls, file uploads. Viable as a premium-only "auto-apply" feature at €19.99/month.

**Simpler version first:** One-click apply for jobs that have "Easy Apply" / direct email. Parse the application email address from job description → generate a pre-written email with CV attached.

---

## Phase 4 — Advanced AI Features

### 4.1 Interview Preparation

**What:** Based on the job description + user's CV, generate:
- 10 likely interview questions
- Suggested answers based on user's actual experience
- STAR-format behavioral question responses
- Salary negotiation range (based on Glassdoor/Levels.fyi data for that role + market)

**Implementation:** Another AI prompt call. Very high perceived value. Charge 2 credits for this (signals premium value).

---

### 4.2 CV Improvement Suggestions

**What:** User uploads their base CV → AI analyzes it against their target role → returns:
- "Your CV has 7 improvement opportunities"
- Specific before/after examples
- ATS keyword gap analysis
- Score: 67/100

**This is a lead-generation mechanic** — run it free (no credits) to get users to sign up, then charge for the "fix it" action.

---

### 4.3 LinkedIn Profile Optimizer

**What:** Input: LinkedIn profile URL → Output: rewritten LinkedIn summary, headline, experience bullets optimised for the user's target role.

**Why:** "Optimize my LinkedIn" is one of the top career coaching requests. This expands your addressable market beyond "active job seekers" to "passive job seekers" (everyone).

---

### 4.4 Salary Intelligence

**What:** For each job listing, show:
- Estimated salary range for this role in this city (based on scraped/public data)
- "Market rate for Senior React Developer in Warsaw: €45k-€65k"
- Percentile: "This offer is below market rate for this role"

**Data sources:** Glassdoor (scrape), LinkedIn Salary Insights (scrape), Levels.fyi (public data), local salary surveys.

**Monetisation:** Salary data shown free. "Get negotiation script for this offer" = 1 credit.

---

## Technical Debt to Address

These are not features but code changes that will prevent future problems:

### TD-1: Remove Firebase dependency
Firebase is installed but unused. Remove `firebase` from `package.json`. Saves ~500KB bundle.

### TD-2: Environment variable validation
Add startup validation:
```typescript
// lib/config.ts
const required = ['ANTHROPIC_API_KEY'] as const;
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
}
```

### TD-3: Rate limiting on AI endpoints
Currently any user can hammer `/api/generate-cv` and drain your AI budget. Add:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
// 5 requests per user per hour
```
Use Upstash Redis (free tier: 10k requests/day).

### TD-4: Error monitoring
Add **Sentry** (free tier) to catch runtime errors. Right now you have no visibility into what's failing in production.
```bash
npm install @sentry/nextjs
```

### TD-5: Input sanitization
The `generate-cv` route passes user input directly into AI prompts. While low-risk (it's their own data), add max-length guards and strip HTML from CV input.

### TD-6: Replace sessionStorage for job data transfer
Currently job data is passed to `/apply` via `sessionStorage` — breaks on page refresh and doesn't work in new-tab scenarios properly. Replace with URL params (for short data) or a Redis/Supabase temporary store (for full job objects).

---

## Marketing & Distribution Strategy

Building the product is 20% of the work. Getting users is 80%.

### Channel 1: SEO (Free, Compound Growth)

**Target keywords:**
- "AI CV generator Europe" (low competition, high intent)
- "tailored CV generator Swedish jobs" (very low competition)
- "job application tracker free"
- "CV generator Polish market"
- "ATS-friendly CV generator"

**What to create:**
1. Blog: `resvio.online/blog` — write 2 posts/month. Target job seeker questions: "How to write a Swedish CV", "What is ATS and how to beat it", "CV format for Norwegian job market"
2. Each blog post links to the tool: "Try our free AI CV generator"
3. Create free tools as SEO magnets: `/cv-checker` (free ATS score, no login required), `/salary-calculator-stockholm`

**Timeline:** SEO takes 3-6 months to show results. Start now.

---

### Channel 2: Reddit & Communities (Free)

**Target communities:**
- r/cscareerquestions (2M members)
- r/ExpatFinance, r/SwedenJobs (smaller but targeted)
- r/poland (job seeker threads)
- Polish Facebook groups: "Praca w Szwecji", "Polacy w Skandynawii"
- LinkedIn groups: "Stockholm Tech Jobs"

**Approach:** Don't spam. Answer genuine questions helpfully. Mention Resvio only when directly relevant. One genuine helpful comment in the right thread can send 500 users.

---

### Channel 3: ProductHunt Launch

**When:** After auth + payments are live and you have ≥10 real users who can upvote.

**What to prepare:**
- 60-second demo video (screen recording with Loom)
- 5 compelling screenshots
- Tagline: "Find jobs across Europe + AI-tailored CV in 60 seconds"
- Offer: "PH exclusive: 20 credits free (instead of 3)"

**Why it matters:** A good ProductHunt launch can bring 500-2000 signups in one day. Even a mediocre launch brings 100-300.

---

### Channel 4: LinkedIn Content (Founder-Led)

Post 2x/week as yourself about:
- Job market insights for Europeans
- "I built an AI CV tool — here's what I learned"
- Behind-the-scenes product updates
- Job seeker tips (that naturally showcase Resvio features)

**LinkedIn algorithm strongly favors personal posts** over company pages. Use your personal profile, not a company page.

---

### Channel 5: Cold Email to Career Coaches

Career coaches charge €100-300/hour and manually help clients with CVs. Resvio can be their secret weapon.

**Pitch:** "I'll give you and your clients free access to Resvio in exchange for feedback and testimonials. Your clients get better results faster, you look more tech-savvy."

**Volume:** 50 personalized cold emails → expect 5-10 responses → 2-3 active coaches promoting to their audience.

---

## Pricing Psychology

Your current pricing is correct but missing one thing: **anchoring**.

Add a "Most Popular" badge to Growth (€8.99). Add an "Enterprise" tier at €29.99 (even if it's just Pro + email support) — this makes Pro look reasonable. 

Consider a **"money-back guarantee"**: "Not happy? Get a refund within 7 days, no questions asked." This increases conversion by 15-30% with almost zero cost (very few people actually request refunds).

For the free plan: **never reduce the free credits below 3**. The free plan is your acquisition cost, not a charity. Every free user is a potential paying user or referrer.

---

## Revenue Projections

Conservative estimates based on industry benchmarks for job-search SaaS:

| Milestone | Users | Conv. Rate | MRR |
|-----------|-------|------------|-----|
| 3 months | 500 free | 3% | ~€60 |
| 6 months | 2,000 free | 5% | ~€400 |
| 12 months | 8,000 free | 6% | ~€2,400 |
| 18 months | 25,000 free | 7% | ~€10,000 |

Key levers to accelerate:
- B2B deal (1 company = €99-299/month)
- ProductHunt spike
- Browser extension (passive acquisition)
- Job alert emails (re-engagement → upgrades)

---

## Recommended Execution Order

```
Week 1-2:   Supabase auth integration (Phase 0.1)
Week 2-3:   Stripe checkout (Phase 0.2) + credits UI (Phase 1.2)
Week 3-4:   Vercel production deploy, env vars, DNS confirmed
Week 4:     Onboarding flow (Phase 1.1)
Week 5:     Cover letter generator (Phase 1.5)
Week 6:     Job alerts via email (Phase 2.3)
Week 7-8:   Analytics + funnel tracking (Phase 2.4)
Week 8:     ProductHunt preparation
Week 9:     ProductHunt launch
Month 3+:   Browser extension
Month 4+:   Mobile app / B2B tier
Month 6+:   Monthly subscription plan, interview prep
```

---

## Summary: The 3 Things That Matter Most Right Now

1. **Auth + Payments** — Without these, you cannot earn anything. Do this first, nothing else matters.
2. **Onboarding flow** — Users who don't see value in 5 minutes never come back. Make the first experience magical.
3. **One acquisition channel** — Pick either SEO content or ProductHunt launch. Execute it properly. Don't spread thin across 5 channels at once.

Everything else in this document is important, but these three unlock the flywheel.
