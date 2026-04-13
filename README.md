# 🚀 Applyarr

**Applyarr** is a premium AI-powered job application assistant designed for the Scandinavian market. It aggregates jobs from multiple sources, analyzes descriptions, and tailors professional CVs using a high-end Scandinavian design system.

## ✨ Features
- **Smart Aggregation**: Search LinkedIn, Indeed, JobTech, and The Hub in one place.
- **AI CV Tailoring**: Automatically rewrite your profile summary and experience to match specific job requirements.
- **Premium Design**: Export ready-to-print, beautiful two-column CVs.
- **Date & Pagination**: Narrow down searches by time and browse hundreds of results.

## 🚀 Getting Started

### Local Development (Recommended)
Local development allows full functionality, including Playwright-based scrapers (LinkedIn/Indeed).

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Environment Setup**:
   Create a `.env.local` file with:
   ```
   OPENAI_API_KEY=...
   ANTHROPIC_API_KEY=...
   ```
3. **Run dev server**:
   ```bash
   npm run dev
   ```

### Vercel Deployment
The project is Vercel-ready. Note that LinkedIn/Indeed scrapers are automatically disabled on Vercel due to serverless execution limits.

## 📄 Documentation
For detailed technical assumptions, architecture, and roadmap, see:
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)**: Master technical handover.
- **[CLAUDE.md](./CLAUDE.md)**: Specific instructions for AI developers.

## 🔐 Authentication
The dashboard is protected via Basic Auth.
- **Password**: `2WJFRE12wjfre1` (Configurable in `middleware.ts`).
