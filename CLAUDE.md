# Developer Guide for Resvio

This guide provides specific instructions for Claude/Windsurf agents to build and maintain the project.

## Build & Dev Commands
- **Install**: `npm install`
- **Dev Server**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`

## Project Structure & Architecture
- **Next.js**: App Router (`app/`).
- **Scrapers**: Located in `lib/services/scrapers/`. Note that Playwright scrapers (`linkedin.ts`, `indeed.ts`) are **local-only** (environment variable `VERCEL !== '1'`).
- **CV Engine**: Located in `app/apply/page.tsx`. Uses `@media print` for PDF layout.
- **Persistence**: `data/profile.json` acts as a local database for user profiles.

## Coding Style & Rules
- **Formatting**: Use TypeScript for all new files. Prefer functional components.
- **Styling**: Vanilla CSS with variables in `globals.css`. Follow the premium Scandinavian aesthetic (minimalism, glassmorphism, accent gold/teal).
- **AI Integration**: Always check for `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in `process.env`.
- **Error Handling**: Scrapers should always return an empty array `[]` on failure, never throw, to ensure the aggregator (`job-service.ts`) completes.

## Key References
- See **PROJECT_OVERVIEW.md** for detailed architectural assumptions and roadmap.
- Middleware Password: `2WJFRE12wjfre1`.
