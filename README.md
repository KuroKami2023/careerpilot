# CareerPilot AI

AI-powered job application assistant: analyze resumes, decode job descriptions, score compatibility **transparently**, prep for interviews, and track applications.

**Stack (JavaScript only — no TypeScript):** React 18 · Vite 5 · Tailwind CSS 3 · React Router 6 · Recharts 2 · Vercel serverless functions (Node) · Supabase (PostgreSQL + Auth + Storage) · NVIDIA Nemotron 3 Nano Omni 30B A3B Reasoning via `https://integrate.api.nvidia.com/v1`.

> Compatibility scores measure **skill/requirement overlap** across fixed weights. They are **never** described as a probability of getting hired.

## Features

- **Resumes** — upload a file (private Supabase Storage) and/or paste text; server-side AI extraction (name, summary, skills, experience, education, projects, certifications, technologies); edit everything; multiple resumes; delete.
- **Jobs** — paste a description or import a public posting URL (safe single fetch; manual paste always works as fallback); server-side AI analysis (required/preferred skills, technologies, responsibilities, experience/education requirements, keywords, seniority).
- **Compatibility** — deterministic 40/25/15/10/10 overlap score with matching/missing/strong/weak skills + recommendations. Radar + bar charts via Recharts.
- **Interview prep** — technical, behavioral, system-design (when relevant), missing-skill, and role-specific questions; per-question sample answers + improvement tips.
- **Application tracker** — Saved / Applied / Interview / Technical Interview / Offer / Rejected / Withdrawn with company, position, URL, salary, dates, notes, interview + follow-up dates.
- **Demo mode** — synthetic resumes + jobs + questions; works without uploading a real resume.
- **Privacy** — RLS everywhere, private storage bucket, server-only NVIDIA key, delete-my-data feature.

## Quick start

1. **Supabase** — create a free project, then run `supabase/schema.sql` in SQL Editor. Create a **private** bucket named `resumes`, then apply the commented policies in `supabase/storage.sql`.
2. **Env** — copy `.env.example` to `.env`:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend)
   - `NVIDIA_API_KEY` — set in Vercel project env (server only; **never** `VITE_`-prefixed).
3. **Run**:
   ```bash
   npm install
   npm run dev      # http://localhost:5175
   npm test         # node --test
   npm run build
   ```
4. **Deploy** — import to Vercel (Hobby), set the 3 env vars, deploy. See `DEPLOYMENT.md`.

## Project layout

```
api/                  Vercel serverless functions (JS only)
  health.js           GET  /api/health
  resume-extract.js   POST /api/resume-extract
  job-analyze.js      POST /api/job-analyze
  compatibility.js    POST /api/compatibility (deterministic, no AI)
  interview-generate.js POST /api/interview-generate
  interview-answer.js POST /api/interview-answer
  job-import.js       POST /api/job-import (safe URL fetch)
  _lib/               nvidia.js, scoring.js, schemas.js, validation.js, rateLimit.js
src/                  React frontend (JS only, .jsx)
  pages/              Dashboard, Resumes, ResumeDetail, Jobs, JobDetail, Match,
                      Interview, Applications, Demo, Settings, Login/Register/…
  components/         Layout, MatchCharts (Recharts), SkillBadges, …
  utils/              demoData.js (synthetic), scoring.js (browser mirror), …
supabase/             schema.sql (tables + RLS), storage.sql (private bucket)
tests/                node:test suites (scoring, schemas, validation)
```

## Docs

- `ARCHITECTURE.md` — system design
- `AI_PIPELINE.md` — prompts, parsing, evaluation
- `DATABASE.md` — tables + RLS
- `API.md` — endpoint contracts
- `SECURITY.md` — threat model + controls
- `PRIVACY.md` — data handling + deletion
- `DEPLOYMENT.md` — Vercel Hobby + Supabase Free setup

## Portfolio positioning

Demonstrates NLP (structured extraction), multimodal-ready AI service design, transparent AI evaluation (fixed-weight scoring with auditable math), recommendation generation, Supabase Auth, PostgreSQL + RLS, full-stack JavaScript, serverless APIs, and privacy-aware AI architecture.
