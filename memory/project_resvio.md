---
name: Project Resvio Overview
description: Core architecture and CV engine details for the Resvio job application assistant
type: project
---

AI-powered job application assistant for the European market (Sweden, Denmark, Norway, Poland, and more).

**Why:** Automates job searching, CV tailoring, and application preparation for European employers.

**How to apply:** When making any changes, respect Scandinavian aesthetic (glassmorphism, gold/teal accents), and ATS-optimization requirements for CVs.

## Key Architecture
- **Framework**: Next.js App Router (app/)
- **CV Engine**: `app/apply/page.tsx` — parses Markdown → two-column Scandinavian layout (dark sidebar + main column)
- **CV Generation API**: `app/api/generate-cv/route.ts` — builds prompt, calls OpenAI (gpt-4o) or Anthropic (claude-3-5-sonnet)
- **AI Service**: `lib/services/ai-service.ts` — wrapper for OpenAI/Anthropic
- **Profile/Data**: `data/profile.json` — source of truth for user profile and base CV
- **Scrapers**: `lib/services/scrapers/` — LinkedIn/Indeed (Playwright, local-only), JobTech/Arbetsförmedlingen API, The Hub

## CV Templates (lib/cv-templates.ts)
3 templates: `minimal` (clean labels+content), `sidebar` (dark Nordic sidebar), `grid` (education|experience side-by-side).
Passed as `templateId` in generate-cv API request. Renderer in apply/page.tsx dispatches to CvMinimal / CvNordic / CvGrid.
AI prompt uses template's `sectionOrder` and `layoutHint`. max_tokens = 3000. Model: claude-sonnet-4-6.

## CV Markdown Format (current)
The `parseMarkdownCv()` function in apply/page.tsx expects:
- `# Name`, `## Job Title`, `CONTACT: a | b | c`
- `## SECTION` headers — sidebar if title contains: skill/language/software/tool/competenc/technolog/additional/interest/certification/award/profil
- `### Sub-header` for job entries
- `- bullet` points for achievements
- GDPR clause at end (triggered by `---` + `*I hereby consent...`)

## Styling Constants
- Dark sidebar: `#1c2333`, Gold accent: `#b8975a`, Body: `#ffffff`
- CV page: 210mm × 297mm A4, `@media print` for PDF export
