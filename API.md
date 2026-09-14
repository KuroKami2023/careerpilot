# API.md — CareerPilot AI

Base: same origin (`/api/*` via `vercel.json`). All POST bodies are JSON (1MB cap). Rate limits are per-IP sliding windows; `X-RateLimit-Remaining` is returned.

## `GET /api/health`
```json
{ "ok": true, "service": "careerpilot-ai", "ai_model": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", "ai_configured": true, "time": "…" }
```

## `POST /api/resume-extract` (20/min)
Request: `{ "resumeText": "…" }` (50–60k chars).
Response:
```json
{ "ok": true, "extraction": { "name": "", "summary": "", "skills": [], "experience": [{ "title": "", "company": "", "duration": "", "details": "" }], "education": [{ "degree": "", "school": "", "year": "" }], "projects": [{ "name": "", "description": "", "technologies": [] }], "certifications": [], "technologies": [], "confidence": 0 }, "meta": { "durationMs": 0, "aiLatencyMs": 0, "attempts": 1 } }
```

## `POST /api/job-analyze` (20/min)
Request: `{ "description": "…", "title": "", "company": "" }`.
Response:
```json
{ "ok": true, "analysis": { "required_skills": [], "preferred_skills": [], "technologies": [], "responsibilities": [], "experience_requirements": "", "education_requirements": "", "keywords": [], "seniority": "" }, "meta": { "durationMs": 0, "aiLatencyMs": 0, "attempts": 1 } }
```

## `POST /api/compatibility` (60/min, no AI)
Request: `{ "resume": { "skills": [], "technologies": [], "experience": [], "education": [], "projects": [] }, "jobAnalysis": { "required_skills": [], "preferred_skills": [], "technologies": [], "responsibilities": [], "experience_requirements": "", "education_requirements": "", "keywords": [] } }`.
Response:
```json
{ "ok": true, "compatibility": { "overall": 0, "breakdown": { "technical": 0, "experience": 0, "projects": 0, "education": 0, "keywords": 0 }, "weights": { "technical": 40, "experience": 25, "projects": 15, "education": 10, "keywords": 10 }, "matching_skills": [], "missing_skills": [], "strong_matches": [], "weak_matches": [], "recommendations": [], "disclaimer": "Skill/requirement overlap only — not a probability of getting hired." } }
```

## `POST /api/interview-generate` (15/min)
Request: `{ "jobDescription": "…", "missingSkills": [], "roleTitle": "", "resumeSummary": "", "count": 8, "includeSystemDesign": false }`.
Response: `{ "ok": true, "questions": [{ "category": "technical|behavioral|system_design|missing_skill|role_specific", "question": "…", "skill_tag": "", "sort_order": 0 }], "meta": { … } }`.

## `POST /api/interview-answer` (20/min)
Request: `{ "question": "…", "roleTitle": "", "resumeSummary": "", "category": "technical" }`.
Response: `{ "ok": true, "sample_answer": "…", "improvement_tips": "…" }`.

## `POST /api/job-import` (10/min, no AI)
Request: `{ "url": "https://…" }`.
Success: `{ "ok": true, "imported": true, "title": "…", "description": "…", "sourceUrl": "…" }`.
Graceful fallback (HTTP 200): `{ "ok": true, "imported": false, "reason": "blocked|fetch_failed|unsupported_type|too_large|timeout|no_content", "message": "…paste the description manually…" }`.

## Errors
```json
{ "ok": false, "error": "Human-readable, public-safe message" }
```
Codes: 400 validation, 405 method, 413 too large, 429 rate-limited, 500 unset key/misconfig, 502 AI failure. Internal details are logged server-side only.
