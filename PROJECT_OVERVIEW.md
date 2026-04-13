# 🚀 Applyarr: Project Overview & Technical Handover

Applyarr is a premium, AI-powered job application assistant specifically tailored for the Scandinavian market (Sweden, Denmark, Norway). It aims to automate the tedious parts of job searching—finding listings, analyzing descriptions, and tailoring CVs—while maintaining a high-end, professional aesthetic.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16.2.3 (App Router)
- **Runtime**: Node.js v22
- **Language**: TypeScript
- **Frontend**: React 19, Vanilla CSS (Premium Glassmorphism & Scandinavian Design)
- **AI Providers**: 
  - **OpenAI**: GPT-4o for complex tailoring and extraction.
  - **Anthropic**: Claude 3.5 Sonnet for high-quality text generation.
- **Scraping & Automation**:
  - **Playwright Extra (Stealth)**: Used for LinkedIn and Indeed.
  - **Axios**: Used for official REST APIs (JobTech/Arbetsförmedlingen).
- **PDF Generation**: `@react-pdf/renderer` + custom HTML Print-to-PDF styles.
- **Persistence**: 
  - `data/profile.json`: Mock database for user profiles.
  - `sessionStorage`: Used to pass job context to the `/apply` tab.

---

## 🧬 Architectural Overview

### 1. Job Aggregation System (`lib/services/job-service.ts`)
The `JobService` orchestrates multiple scrapers in parallel:
- **JobTech**: Refers to the official Swedish Arbetsförmedlingen API. Most stable.
- **The Hub**: Startup jobs in Scandinavia.
- **LinkedIn/Indeed**: Playwright-based scrapers. 
  - > [!IMPORTANT]
  - > These scrapers are **local-only**. They are disabled on Vercel due to Playwright execution limits. Deployment version relies mostly on JobTech.

### 2. Premium CV Engine (`app/apply/page.tsx`)
A two-column, Scandinavian-style CV renderer.
- **Sidebar**: Dark bg, containing contact info and skills.
- **Main Column**: Clean typography with gold accents for experience.
- **Export**: Uses `@media print` and a hidden print container to ensure "Print to PDF" in-browser produces a professional document.
- **AI Tailoring**: The `generate-cv` API takes a job description and the base CV to rewrite summaries and experience bullet points for maximum relevance.

### 3. Application Workflow
- **Search**: `app/page.tsx` + `app/search`. Implements pagination and date filtering.
- **Job Analysis**: Clicking "Apply" opens a new tab. It reads the job data from `sessionStorage`.
- **Manual Input**: If a job description is missing (common with scrapers), the user can paste it manually to trigger AI analysis.

---

## 🔐 Security & Auth
The application is protected by a global Basic Auth middleware.
- **Password**: `2WJFRE12wjfre1`
- **Logic**: Defined in `middleware.ts`.

---

## 📂 Key Directory Map
- `app/api/`: Reusable backend logic for AI analysis, CV generation, and scraping.
- `app/components/`: Premium UI components (Glass cards, premium buttons).
- `lib/services/scrapers/`: Individual logic for each job board.
- `lib/services/ai-service.ts`: Wrapper for OpenAI/Anthropic interaction.
- `data/profile.json`: Current "Source of Truth" for user data.

---

## 🚧 Current Status & Roadmap

### ✅ Completed
- [x] Multi-source job search with pagination & date filters.
- [x] AI CV tailoring with professional Scandinavian design.
- [x] PDF Export optimization.
- [x] AI extraction of base CV data from PDF upload.

### 📅 Next Steps for Future AI Agents
1. **Real-time Match Scoring**: Integrate `AIService.analyzeMatch` directly into the search results page (currently score is randomized).
2. **Database Integration**: Migrate from `profile.json` to a real DB (Supabase/Prisma) for multi-user support.
3. **Automated Applying**: Implement the "Form Filling" logic (started but disabled due to Vercel/Complexity).
4. **LinkedIn Profile Parsing**: Enhance the LinkedIn scraper to extract full job descriptions.

---

## 💡 Developer Guidelines
- **Styling**: Always use the defined CSS variables in `globals.css` (e.g., `--gold`, `--nordic-blue`).
- **Scraping**: Local testing required for Playwright. Ensure `userAgent` is rotated or stealthy.
- **AI**: Be extremely specific in prompts about "Scandinavian professional standards" (concise, clear, humble but professional).
