# ARCHITECTURE.md — CareerPilot AI

## 1. Overview

CareerPilot AI is a full-stack JavaScript SaaS (no TypeScript) deployed on Vercel Hobby with Supabase Free as the data plane and NVIDIA's free API endpoint as the AI plane.

```
Browser (React + Vite + Tailwind + Router + Recharts)
  │  Supabase Auth (session) + anon-key REST (RLS-enforced)
  ▼
Supabase Free ── PostgreSQL (7 tables, RLS) + Storage (private `resumes` bucket)
  │
  │  POST /api/* (same origin, no secrets in browser)
  ▼
Vercel Serverless Functions (Node, JS only)
  ├── validation.js   input validation + safe URL checks
  ├── rateLimit.js    per-IP sliding window
  ├── schemas.js      AI output sanitization → canonical shapes
  ├── scoring.js      deterministic compatibility math
  └── nvidia.js       server-only NVIDIA chat client (NVIDIA_API_KEY)
        ▼
https://integrate.api.nvidia.com/v1 — nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
```

## 2. Frontend (`src/`)

- `main.jsx` bootstraps React + Router + `AuthProvider`.
- `App.jsx` — public-only auth routes (`/login`, `/register`, `/forgot-password`) + protected `Layout` with 9 sections.
- `context/AuthContext.jsx` — Supabase session lifecycle.
- `lib/supabaseClient.js` — anon-key client with missing-env warning.
- `lib/api.js` — thin fetch wrapper for our own `/api/*` (never sends AI keys).
- `pages/` — one route per workflow: Dashboard, Resumes, ResumeDetail (edit), Jobs, JobDetail (analysis view), Match (Recharts), Interview (sessions), Applications (tracker), Demo (offline synthetic), Settings (profile + delete-data).
- `components/MatchCharts.jsx` — ScoreDonut (SVG), MatchBars + MatchRadar (Recharts).
- `utils/scoring.js` — browser mirror of the server algorithm, used as offline fallback and by Demo mode (no network).
- `utils/demoData.js` — two synthetic resumes, two synthetic jobs with precomputed analyses, six sample questions.

## 3. Backend (`api/`)

| Endpoint | AI? | Purpose |
|---|---|---|
| `GET /api/health` | No | Liveness + `ai_configured` flag (no key leakage) |
| `POST /api/resume-extract` | Yes | Resume text → canonical extraction |
| `POST /api/job-analyze` | Yes | JD → canonical analysis |
| `POST /api/compatibility` | No | Deterministic 40/25/15/10/10 scoring |
| `POST /api/interview-generate` | Yes | JD + gaps → question list (no answers) |
| `POST /api/interview-answer` | Yes | One question → sample answer + tips |
| `POST /api/job-import` | No | Safe single-fetch public URL → readable text |

All POST handlers share the pattern: CORS → method check → rate limit (`X-RateLimit-Remaining`) → `readJsonBody` → validator → work → `sendJson`. Errors map through `toPublicError` so internals never leak.

## 4. Data flow examples

**Resume save:** paste/upload → `POST /api/resume-extract` (NVIDIA, sanitized) → insert `resumes` row → optional private Storage upload at `resumes/<uid>/<resumeId>/<file>` → update row with `file_path`.

**Match:** pick resume + analyzed job → `POST /api/compatibility` → deterministic result → render donut/bars/radar + badges; optionally snapshot `match_score`/`match_breakdown` onto an `applications` row.

**Interview:** JD + missing skills → `POST /api/interview-generate` → insert `interview_sessions` + `interview_questions` rows → per-question `POST /api/interview-answer` updates that row.

## 5. Key decisions

- **Deterministic scoring, not LLM scoring** — the match is auditable arithmetic (see `AI_PIPELINE.md`), so it can't hallucinate favoritism and can't be mistaken for a hiring prediction.
- **Sanitize at the boundary** — `schemas.js` is the only place AI JSON becomes app data; unknown keys are dropped, strings truncated, arrays deduped.
- **RLS as the real authorization** — the API never touches Supabase with a service key; the browser uses the user JWT and RLS guarantees ownership.
- **Vercel Hobby-safe** — no cron, no websockets, no long connections; in-memory rate limiting is per-instance and best-effort (documented limitation).
- **JS only** — no `tsc`, no `.ts`/`.tsx`; `node --test` for zero-dependency tests.
