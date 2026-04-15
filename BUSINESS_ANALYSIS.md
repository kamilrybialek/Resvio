# Resvio — Business & Revenue Analysis
*Internal founder document | Last updated: April 2026*

---

## 1. Market Opportunity

### Active Job Seekers in Target Markets

The following estimates are based on Eurostat, national labor statistics, and LinkedIn active user data (2024–2025).

| Market | Labor Force | Est. Active Job Seekers (Monthly) | Digital-First Seekers (~60%) |
|---|---|---|---|
| Poland | 17.2M | ~860,000 | ~516,000 |
| Sweden | 5.5M | ~220,000 | ~154,000 |
| Norway | 2.9M | ~116,000 | ~81,200 |
| Denmark | 3.2M | ~128,000 | ~89,600 |
| United Kingdom | 34.0M | ~1,700,000 | ~1,190,000 |
| **Total** | **62.8M** | **~3,024,000** | **~2,030,800** |

Notes:
- "Active job seeker" defined as someone who has applied for at least one job in the past 30 days.
- Poland's job seeker base skews heavily digital due to a young, tech-literate workforce and high prevalence of platforms like JustJoinIT and RocketJobs.
- UK figure reflects a large but competitive market; UK entry is Phase 3 and should be treated as a separate TAM expansion.

---

### TAM / SAM / SOM Analysis

**TAM — Total Addressable Market**

The global online job search and recruitment SaaS market was valued at approximately USD 28.7B in 2024 (Grand View Research), growing at ~7.1% CAGR. Narrowing to Europe:

- European addressable market for job seeker-side tools: ~USD 3.2B/year
- Scoped to Poland + Nordics + UK: approximately USD 820M/year
- **TAM: ~820M USD / ~850M EUR / ~9.2B SEK**

**SAM — Serviceable Addressable Market**

Resvio serves a subset: digitally active job seekers who are open to paying for AI-assisted job search tools. Based on SaaS conversion benchmarks for career tools (freemium model, ~3–8% of active users convert to paid):

- 2.03M digital-first job seekers × estimated 12% awareness-and-consideration rate = ~244,000 potential paying users
- Average revenue per user (blended, see pricing below): ~75 kr/mo (~7 EUR)
- **SAM: ~244,000 users × 75 kr × 12 months = ~219.6M kr/year (~20.6M EUR)**

**SOM — Serviceable Obtainable Market (3-year horizon)**

A realistic 3-year capture assuming successful execution:

- Year 1: 0.08% of SAM = ~200 paid users
- Year 2: 0.41% of SAM = ~1,000 paid users
- Year 3: 2.05% of SAM = ~5,000 paid users (base scenario)
- **SOM (Y3 base): ~5,000 users × 75 kr blended ARPU × 12 = ~4.5M kr/year (~425K EUR)**

---

### Competitive Landscape

| Competitor | Price (Monthly) | Core Strength | Core Weakness vs. Resvio |
|---|---|---|---|
| LinkedIn Premium Career | ~450 kr / ~42 EUR | Brand trust, network effects, massive job index | Single platform only, no CV tailoring, very expensive |
| CV Compiler | ~$19 USD | ATS-optimized CV reviews | No job aggregation, no cover letters, US-focused |
| Kickresume | ~$19 USD / ~199 kr | Beautiful CV templates, AI writing | No job search, no multi-market, template-first |
| Zety | ~$24 USD / ~249 kr | CV + cover letter builder | No job search, no market aggregation, US-focused |
| NoFluffJobs Premium | ~49 PLN / ~49 kr | Strong Polish IT market presence | Poland-only, no AI CV, no Nordic market |
| Pracuj.pl / StepStone | Free-to-search (employer-paid) | Large Polish/EU job index | No AI tools, no aggregation, no CV engine |

**Resvio's Differentiation:**

1. **Multi-market aggregation**: No competitor aggregates LinkedIn + Indeed + JustJoinIT + RocketJobs + Arbetsförmedlingen + The Hub in a single interface. This is the moat.
2. **AI CV tailoring per job**: Real-time, per-job CV rewriting using GPT-4o-mini/Claude Haiku — not generic templates.
3. **Language-aware cover letters**: EN/PL/SV/DE in a single workflow. Kickresume and Zety do not handle Swedish or Polish job market nuances.
4. **Nordic-first positioning**: Arbetsförmedlingen + The Hub integration is unique. No other consumer tool targets Polish job seekers relocating to Sweden specifically.
5. **Price point**: At 49–149 kr/mo, Resvio is 3–9x cheaper than LinkedIn Premium while offering complementary (not competing) value.

---

## 2. Pricing Strategy

### Tier Summary

All prices in SEK (primary Nordic pricing) with EUR equivalent for EU/Polish market. EUR conversions at 1 EUR ≈ 10.6 SEK.

---

#### Free — 0 kr / 0 €

**Designed to:** Drive top-of-funnel adoption, demonstrate value, create word-of-mouth.

| Feature | Limit |
|---|---|
| AI CV tailorings | 3 per month |
| AI cover letters | 3 per month |
| Job search markets | 1 market only |
| Application tracker | 7-day history |
| Language support | EN only |
| Support | Community / FAQ |

---

#### Starter — 49 kr/mo (monthly) · 39 kr/mo (billed annually = 468 kr/yr)
**EUR equivalent:** ~4.60 €/mo monthly · ~3.68 €/mo annual

**Designed to:** Convert active job seekers who are running multiple applications per week.

| Feature | Limit |
|---|---|
| AI CV tailorings | 15 per month |
| AI cover letters | 15 per month |
| Job search markets | All 5 markets + remote |
| AI match scoring | Included |
| Application tracker | Unlimited |
| Language support | EN / PL / SV / DE |
| Support | Email (48h response) |

Annual saving vs monthly: 120 kr/year (~10 EUR). Discount: 20%.

---

#### Pro — 149 kr/mo (monthly) · 119 kr/mo (billed annually = 1,428 kr/yr)
**EUR equivalent:** ~14.06 €/mo monthly · ~11.23 €/mo annual

**Designed to:** Power users, expats managing complex multi-country job searches, developers.

| Feature | Limit |
|---|---|
| AI CV tailorings | Unlimited |
| AI cover letters | Unlimited |
| CV profiles | 3 simultaneous |
| Job search markets | All 5 markets + remote |
| AI match scoring + analytics | Advanced |
| Priority AI processing | Faster queue |
| API access | REST API for integrations |
| Language support | EN / PL / SV / DE |
| Support | Priority email (24h) |

Annual saving vs monthly: 360 kr/year (~34 EUR). Discount: 20%.

---

#### Team — 499 kr/mo (billed monthly, up to 5 seats · ~99 kr/seat)
**EUR equivalent:** ~47.08 €/mo

**Designed to:** Small recruitment firms, HR teams, university career centers, bootcamp cohorts.

| Feature | Limit |
|---|---|
| All Pro features | × 5 user seats |
| Admin dashboard | Included |
| Usage analytics | Per-seat breakdown |
| Custom onboarding | 1 session included |
| Support | Dedicated Slack/email |
| Billing | Single invoice |

Additional seats: +79 kr/seat/mo beyond 5.

---

### Pricing Rationale

- **49 kr Starter** sits below the psychological "coffee" threshold (~50 kr). Comparable to Spotify Premium (119 kr) but significantly below LinkedIn Premium (450 kr+). Polish market equivalent ~19 PLN — competitive with NoFluffJobs Premium.
- **149 kr Pro** is the primary revenue target. Power users in Sweden/Norway/Denmark have high willingness to pay. Equivalent to ~14 EUR, well within discretionary SaaS spending for professionals.
- **Annual billing discount (20%)** improves cash flow and reduces churn. Annual plans should be the default-presented option.
- **SEK as anchor currency**: The Nordic market (Sweden, Norway, Denmark) has higher purchasing power and lower price sensitivity. Pricing in SEK signals Nordic-first intent and avoids the currency conversion hesitation that EUR/PLN pricing creates for Swedish users.

---

## 3. Revenue Projections

### Assumptions

| Variable | Value |
|---|---|
| Tier distribution | 60% Starter / 30% Pro / 10% Team |
| Billing mix | 70% monthly / 30% annual |
| Blended Starter ARPU (monthly equiv.) | (0.7 × 49) + (0.3 × 39) = **45.5 kr** |
| Blended Pro ARPU (monthly equiv.) | (0.7 × 149) + (0.3 × 119) = **139.4 kr** |
| Blended Team ARPU (monthly equiv.) | (0.7 × 499) + (0.3 × 449*) = **484.0 kr** |
| Weighted blended ARPU | 0.60 × 45.5 + 0.30 × 139.4 + 0.10 × 484.0 = **27.3 + 41.8 + 48.4 = **~117.5 kr/user/mo** |

*Team annual assumed at 449 kr/mo (10% discount).

---

### Conservative Scenario

| Period | Paid Users | Monthly Revenue | Annual Revenue |
|---|---|---|---|
| Y1 (avg month) | 50 | ~5,875 kr | ~70,500 kr |
| Y1 (end of year) | 100 | ~11,750 kr | — |
| Y2 (avg month) | 300 | ~35,250 kr | ~423,000 kr |
| Y2 (end of year) | 500 | ~58,750 kr | — |
| Y3 (avg month) | 1,000 | ~117,500 kr | ~1,410,000 kr |
| Y3 (end of year) | 1,500 | ~176,250 kr | — |

**Y3 Conservative ARR: ~1.41M kr (~133K EUR)**

---

### Base Scenario

| Period | Paid Users | Monthly Revenue | Annual Revenue |
|---|---|---|---|
| Y1 (avg month) | 200 | ~23,500 kr | ~282,000 kr |
| Y1 (end of year) | 350 | ~41,125 kr | — |
| Y2 (avg month) | 1,000 | ~117,500 kr | ~1,410,000 kr |
| Y2 (end of year) | 1,500 | ~176,250 kr | — |
| Y3 (avg month) | 5,000 | ~587,500 kr | ~7,050,000 kr |
| Y3 (end of year) | 7,000 | ~822,500 kr | — |

**Y3 Base ARR: ~7.05M kr (~665K EUR)**

---

### Optimistic Scenario

| Period | Paid Users | Monthly Revenue | Annual Revenue |
|---|---|---|---|
| Y1 (avg month) | 500 | ~58,750 kr | ~705,000 kr |
| Y1 (end of year) | 800 | ~94,000 kr | — |
| Y2 (avg month) | 3,000 | ~352,500 kr | ~4,230,000 kr |
| Y2 (end of year) | 4,000 | ~470,000 kr | — |
| Y3 (avg month) | 15,000 | ~1,762,500 kr | ~21,150,000 kr |
| Y3 (end of year) | 20,000 | ~2,350,000 kr | — |

**Y3 Optimistic ARR: ~21.15M kr (~2.0M EUR)**

---

### Scenario Summary Table (ARR at year-end)

| Scenario | Y1 ARR | Y2 ARR | Y3 ARR | Y3 ARR (EUR) |
|---|---|---|---|---|
| Conservative | ~70,500 kr | ~423,000 kr | ~1,410,000 kr | ~133K EUR |
| Base | ~282,000 kr | ~1,410,000 kr | ~7,050,000 kr | ~665K EUR |
| Optimistic | ~705,000 kr | ~4,230,000 kr | ~21,150,000 kr | ~2.0M EUR |

---

## 4. Unit Economics

### Customer Acquisition Cost (CAC)

Early-stage CAC is expected to be low due to an organic-first strategy.

| Channel | Estimated CAC | Notes |
|---|---|---|
| Organic SEO (blog, landing pages) | ~15–30 kr | Long tail; "Swedish CV tips", "jobb i Sverige Polen" |
| ProductHunt launch | ~5–20 kr | One-time burst; high volume, lower intent |
| Polish dev communities (Reddit, X, Discord) | ~10–25 kr | High intent, strong word-of-mouth multiplier |
| Cold outreach / partnerships | ~50–100 kr | JustJoinIT, university career centers |
| Paid social (future) | ~150–300 kr | Reserved for Year 2+ when LTV is proven |

**Blended early-stage CAC estimate: ~30–60 kr (~3–6 EUR)**

At 117.5 kr blended ARPU and ~20% monthly churn (early stage), blended LTV:

- Monthly churn 20% → avg customer lifetime = 5 months
- LTV = 5 × 117.5 = ~587 kr
- **LTV:CAC ratio = 587 / 45 = ~13:1** (organic-driven; healthy)

At scale (Year 2+) with paid acquisition:
- Blended CAC rises to ~150 kr
- Churn improves to ~8% monthly → avg lifetime = 12.5 months
- LTV = 12.5 × 117.5 = ~1,469 kr
- **LTV:CAC ratio = 1,469 / 150 = ~9.8:1** (still strong)

---

### AI API Cost Estimate (Per User/Month)

Based on GPT-4o-mini pricing (~$0.15/1M input tokens, ~$0.60/1M output tokens) and Claude Haiku 3 (~$0.25/1M input, ~$1.25/1M output), with typical usage patterns.

**Assumptions per active paid user/month:**
- 10 CV tailorings × ~1,500 tokens in + ~800 tokens out = 15,000 input / 8,000 output tokens
- 8 cover letters × ~800 tokens in + ~600 tokens out = 6,400 input / 4,800 output tokens
- Total: ~21,400 input tokens / ~12,800 output tokens per user/month

**GPT-4o-mini cost:**
- Input: 21,400 / 1,000,000 × $0.15 = $0.0032
- Output: 12,800 / 1,000,000 × $0.60 = $0.0077
- **Total: ~$0.011 / user / month (~0.11 kr)**

Even at 10× heavier usage (Pro/unlimited tier):
- **Max AI cost: ~$0.11 / user / month (~1.1 kr)**

This is negligible relative to ARPU. AI costs are not a margin risk at current API pricing.

---

### Infrastructure Costs

| Tier / Stage | Monthly Cost | Notes |
|---|---|---|
| Vercel Hobby (current) | 0 kr | Suitable up to ~10K page views/mo |
| Vercel Pro (~200 paid users) | ~250 kr/mo | $20/mo; needed for team features, analytics |
| Vercel Pro + scaling (~1,000 users) | ~500–800 kr/mo | Bandwidth + function invocations scale |
| Database (Firebase / Supabase free) | 0 kr | Free tier handles well under 1,000 users |
| Supabase Pro (~1,000+ users) | ~250 kr/mo | $25/mo; needed for row-level security, backups |
| Domain + email | ~150 kr/mo | DNS + transactional email (Resend/Postmark) |
| Monitoring (Sentry, PostHog free) | 0 kr | Free tiers cover early stage |

**Estimated monthly infra cost by stage:**

| Stage | Users | Monthly Infra Cost |
|---|---|---|
| Early (pre-revenue) | < 100 | ~150 kr (~14 EUR) |
| Growth | 100–500 | ~650 kr (~61 EUR) |
| Scale | 500–2,000 | ~1,200 kr (~113 EUR) |
| Mature | 2,000–10,000 | ~3,500 kr (~330 EUR) |

---

### Gross Margin Estimate

At 1,000 paid users (base Y2):

| Item | Monthly Cost (kr) |
|---|---|
| AI API costs (1,000 users × 1.1 kr avg) | 1,100 |
| Infrastructure | 1,200 |
| Email / monitoring / misc SaaS | 500 |
| **Total COGS** | **2,800 kr** |
| **Revenue (1,000 × 117.5 kr)** | **117,500 kr** |
| **Gross Profit** | **114,700 kr** |
| **Gross Margin** | **~97.6%** |

This is a typical best-in-class SaaS gross margin. AI costs at scale (with heavy Pro users) could compress to ~94–95%, which remains excellent.

---

### Payback Period

| Scenario | Blended ARPU | Blended CAC | Payback Period |
|---|---|---|---|
| Organic (Y1) | 117.5 kr | 45 kr | **< 1 month** |
| Mixed (Y2) | 117.5 kr | 150 kr | **~1.3 months** |
| Paid-heavy (Y3) | 117.5 kr | 300 kr | **~2.6 months** |

Payback periods under 3 months indicate very capital-efficient growth. Even with paid acquisition, cash flow remains strongly positive.

---

## 5. Growth Strategy

### Phase 1 — Months 1–3: Foundation & Free Tier Launch

**Goal:** 500–1,000 registered users, validate core value proposition, iterate on UX.

**Actions:**
- Launch free tier publicly with full job search + 3 CV tailorings/mo
- ProductHunt launch: Target Top 5 of the day in "Productivity" category
  - Prepare hunter network outreach 2 weeks in advance
  - Schedule for Tuesday morning (peak traffic day)
  - Offer 3-month Starter free as PH exclusive
- SEO content strategy:
  - Target long-tail: "jak napisać CV po angielsku", "praca w Szwecji dla Polaka", "CV tips Nordic job market"
  - Publish 2 blog posts/week (AI-assisted drafting)
  - Build programmatic landing pages per market ("Jobs in Stockholm for Poles", "UK tech jobs from Poland")
- Community seeding:
  - Polish developer communities: Programista52tygodnie Facebook group (~52K members), dev.pl, Reddit r/PracaIT
  - Cross-post in Swedish expat groups on Facebook
  - LinkedIn personal founder content (build in public)

**KPIs:** 1,000 registered users, 15% week-4 retention, NPS > 40.

---

### Phase 2 — Months 4–6: Monetization & Polish Market Depth

**Goal:** 100–300 paid users, positive unit economics, validate Starter tier willingness-to-pay.

**Actions:**
- Launch Starter tier with 14-day free trial (no credit card required)
- Email nurture sequence for free users: day 3 / day 7 / day 14 conversion campaigns
- Partnership outreach:
  - JustJoinIT: co-marketing or featured listing swap (their audience = Resvio's ICP)
  - RocketJobs: similar audience, less competitive
  - Bootcamp career centers (Codecool Poland, SDA, Ironhack Warsaw): bulk licenses or affiliate
  - University career centers: Politechnika Warszawska, AGH, Wrocław Tech
- Introduce referral program: "Give 1 month Pro, get 1 month Pro" for each paid referral
- A/B test SEK vs EUR pricing for Polish users (test EUR 4.99 vs PLN 19.99)

**KPIs:** 200 paid users, < 10% monthly churn, MRR > 23,000 kr.

---

### Phase 3 — Months 7–12: Pro Tier & UK Expansion

**Goal:** 350–800 paid users, Pro tier traction, UK market foothold.

**Actions:**
- Launch Pro tier targeting heavy job seekers and expats mid-search
- UK market entry:
  - Add Reed.co.uk and Totaljobs scraping/API integration
  - SEO targeting UK Polish diaspora: ~800,000 Poles in UK, highly digital-active
  - Target r/ImmigrationUK, Polish expat Facebook groups in London
- LinkedIn official API integration (replace scraper with compliant API access for job listings)
- Build application analytics dashboard (Pro feature): response rate by market, CV version performance
- Launch annual billing as default CTA (boost cash flow, reduce churn)
- First PR outreach: Polish tech press (Spider's Web, Antyweb), Swedish startup media (Breakit, Di Digital)

**KPIs:** 700 paid users, 25% on annual plans, MRR > 80,000 kr, UK = 15% of new signups.

---

### Year 2: Team Tier, API & White-Label

**Goal:** 1,000–3,000 paid users, Team tier revenue, B2B pipeline.

**Actions:**
- Launch Team tier targeting:
  - Small recruitment agencies (5–20 person firms in Poland/Sweden)
  - University career offices (institutional licenses)
  - Bootcamp career coaching programs
- Public REST API launch: allow integration with HR tools, ATS systems (Greenhouse, Teamtailor)
- White-label exploration: offer Resvio's CV engine + job aggregation as embedded widget for job boards
- German market feasibility study (XING/StepStone ecosystem, high TAM)
- Consider seed funding raise (~500K–1M EUR) to accelerate paid acquisition and hire first engineer

**KPIs:** 2,000 paid users, 5% Team tier, ARR > 2.8M kr (~265K EUR), 3 B2B contracts signed.

---

## 6. Risk Analysis

### Risk 1: LinkedIn Scraping — Terms of Service Violation

**Severity: High | Probability: Medium**

LinkedIn's ToS prohibits automated scraping. hiQ Labs v. LinkedIn (US case) provided some protection for public data scraping, but enforcement risk remains real, particularly for commercial products.

**Current mitigation (in codebase):** LinkedIn scraper is gated behind `VERCEL !== '1'`, meaning it only runs locally and never on production servers. This is a partial mitigation.

**Recommended mitigations:**
- Phase 1-2: Keep LinkedIn scraper local-only (current approach). Do not run on Vercel production.
- Phase 2: Apply for LinkedIn Job Search API (official partner program). Approval is not guaranteed but legitimate.
- Phase 3: If API denied, pivot LinkedIn job aggregation to showing "apply on LinkedIn" deep-links only (no data extraction).
- Fallback: LinkedIn jobs represent ~30–40% of listings. Loss of this source is painful but not fatal given JustJoinIT + RocketJobs + Indeed coverage for Polish market, and Arbetsförmedlingen + The Hub for Nordics.

**Bottom line:** Do not rely on LinkedIn scraping for production revenue. Build the product to be valuable without it.

---

### Risk 2: AI API Costs at Scale

**Severity: Low-Medium | Probability: Low**

At current GPT-4o-mini pricing (~$0.011/user/month), AI costs are negligible. However, if OpenAI raises prices significantly or usage patterns shift toward GPT-4o (10–30× more expensive), margin compression is possible at scale.

**Mitigations:**
- Multi-provider architecture already in place (OpenAI + Anthropic). Switch providers based on price/performance.
- Implement token budgets per tier: Free users get shorter prompts; Pro users get full context.
- Cache common prompt outputs (e.g., identical job descriptions matched to similar CVs).
- Set hard rate limits per tier to prevent abuse (already implied by tier structure).
- Monitor cost per user monthly. Set alert threshold at 5 kr/user/month (current: ~1.1 kr).

---

### Risk 3: Competition from Well-Funded Players

**Severity: Medium | Probability: Medium**

LinkedIn could add AI CV tailoring to Premium. Zety/Kickresume could add Nordic market coverage. A well-funded startup could clone the concept with better marketing budget.

**Mitigations:**
- Speed is the primary moat: get to market, get users, get data, get testimonials before incumbents react.
- The Nordic-Polish corridor is a very specific niche. LinkedIn has no incentive to serve Polish-to-Sweden job seekers specifically.
- Data network effects: application tracker data and user CVs create personalization value that's hard to replicate.
- Brand and community: build a recognizable brand in Polish developer communities where trust > features.
- Avoid feature parity wars. Double down on the specific workflow of "I'm Polish, I want to work in Sweden" — incumbents cannot own this narrative.

---

### Risk 4: GDPR Compliance

**Severity: High | Probability: High (if ignored)**

Resvio stores CV data, application history, and potentially salary/personal information. As a Swedish/EU-targeted SaaS, GDPR compliance is mandatory, not optional.

**Required actions (before paid launch):**
- Appoint a clear data controller (the company/founder entity).
- Privacy policy: must clearly state what data is collected, where it is stored, retention period, and user rights (access, deletion, portability).
- Data processing agreement (DPA) with Vercel and any database provider (Firebase/Supabase both offer GDPR DPAs).
- CV data: stored only in `data/profile.json` locally is fine for MVP, but cloud storage must be encrypted at rest and access-controlled.
- User data deletion: implement a "delete my account and all data" flow before charging users.
- Cookie consent: implement a proper consent banner (Cookiebot or equivalent) before analytics go live.
- Legal entity: consider registering a Swedish AB or Polish sp. z o.o. before scaling — EU entities simplify GDPR compliance.

**Cost estimate:** €500–2,000 for a privacy lawyer to review documents once; ~€100/year for cookie consent tooling.

---

## 7. Exit & Scale Strategy

### B2C SaaS Growth Path (Primary)

The straightforward path is building a profitable, high-margin B2C SaaS business. At 5,000 paid users with ~117.5 kr blended ARPU, ARR exceeds 7M kr (~665K EUR) with ~97% gross margins. This is a sustainable, owner-operated business at this scale.

Benchmarks from comparable B2C career SaaS (Zety, Kickresume, CVLibrary) suggest that products in this niche can reach €2–10M ARR before requiring institutional capital, driven purely by organic SEO and word-of-mouth.

**Path to €1M ARR:** ~8,500 paid users at blended 117.5 kr ARPU. Achievable by Year 3 in the optimistic scenario, Year 4 in base scenario.

---

### B2B Pivot Opportunity

At scale, the data and technology Resvio builds has significant B2B value:

**Recruitment agency SaaS:**
- Agencies currently pay €200–500/month per recruiter for sourcing tools (LinkedIn Recruiter: ~€800/mo/seat).
- Resvio's multi-market aggregation + AI matching could be repackaged as an inbound candidate tool for recruiters.
- Target: boutique agencies in Poland, Sweden, UK (10–50 person firms).
- Pricing: €199–499/mo per agency (vs. €49/mo per job seeker) — 10–40× revenue per account.

**HR department white-label:**
- Companies running graduate or international hiring programs need multi-market job visibility and AI screening.
- White-label the Resvio CV engine as an embedded "application optimizer" in their careers page.
- Target: mid-size companies (200–2,000 employees) running employer branding programs.

**University career center licensing:**
- Institutional licenses to career centers at Polish and Scandinavian universities.
- Per-student pricing or flat annual fee (~10,000–50,000 kr/year per institution).
- Low CAC (one deal = hundreds of users), high retention (annual renewals).

---

### Acquisition Scenario

Resvio would be an attractive acquisition target for:

| Potential Acquirer | Strategic Rationale | Est. Acquisition Multiple |
|---|---|---|
| JustJoinIT / RocketJobs | Expand from job board to full candidate lifecycle tool; add AI differentiation | 3–5× ARR |
| StepStone / Axel Springer | European job board expansion into AI-assisted search | 4–8× ARR |
| Pracuj.pl Group | Dominant Polish job board seeking AI capabilities and Nordic expansion | 3–6× ARR |
| Teamtailor (ATS) | Add candidate-side tooling to ATS product; strong Nordic presence | 4–8× ARR |
| CV-Library / Reed (UK) | Enter AI-assisted job search; leverage UK user base | 3–5× ARR |

At €1M ARR (base Y3–Y4), a 5× ARR acquisition would value Resvio at €5M. At €2M ARR (optimistic Y3), this rises to €10M+.

**Important:** Do not optimize for acquisition early. Build for profitability and user value. Acquirers pay premiums for growing, profitable products with strong unit economics — not for user-count vanity metrics.

---

### Fundraising Considerations

Resvio does not require external funding to reach profitability. However, a strategic raise could accelerate:

- **Pre-seed (€100–250K):** Bootstrap or angel round. Use for: part-time developer hire, paid acquisition testing, legal/GDPR setup.
- **Seed (€500K–1.5M):** If base scenario is on track by Month 12. Use for: full-time team (2–3 people), paid acquisition at scale, German/French market expansion.
- **Series A (€3–8M):** If B2B pivot shows traction by Year 2–3. Use for: enterprise sales team, white-label infrastructure, API platform buildout.

**Preferred path:** Reach €500K ARR organically before raising. This maximizes founder equity and negotiating leverage.

---

## Summary: Key Numbers to Track

| Metric | Target (Month 6) | Target (Month 12) | Target (Year 2) |
|---|---|---|---|
| Registered users | 2,000 | 5,000 | 25,000 |
| Paid users | 150 | 500 | 2,000 |
| Free-to-paid conversion | 5% | 8% | 10% |
| Monthly churn (paid) | < 15% | < 10% | < 6% |
| Blended ARPU | 100 kr | 110 kr | 120 kr |
| MRR | 15,000 kr | 55,000 kr | 240,000 kr |
| ARR | 180,000 kr | 660,000 kr | 2,880,000 kr |
| Gross margin | 96% | 97% | 97% |
| LTV:CAC ratio | > 8:1 | > 10:1 | > 8:1 |
| AI cost per user/mo | < 2 kr | < 2 kr | < 3 kr |

---

*This document is for internal planning only. Figures are estimates based on market research and comparable SaaS benchmarks as of Q1 2026. Revisit quarterly and update assumptions as real data becomes available.*
