# AI_PIPELINE.md — CareerPilot AI

Model: **nvidia/nemotron-3-nano-omni-30b-a3b-reasoning** (reasoning model, OpenAI-compatible chat API).
Base URL: `https://integrate.api.nvidia.com/v1`. Key: `NVIDIA_API_KEY` (server only).

## 1. Shared client (`api/_lib/nvidia.js`)

- `chatJson({ system, user, temperature, maxTokens })` — single structured call with timeout (60s), retries on 429/5xx/timeout (2 retries, exponential backoff), and safe logging (lengths only, never prompts/keys).
- `extractJson(text)` — handles raw JSON, ` ```json ` fences, prose-wrapped JSON, and trailing-comma repair. Throws a public-safe error when no JSON is found.
- `getModelText` — prefers `message.content`, falls back to `reasoning_content` (reasoning models sometimes put the answer there).
- Low temperatures (0.1–0.2) for extraction/analysis; 0.4 for creative interview content.

## 2. Pipelines

### A. Resume extraction (`POST /api/resume-extract`)
1. Validate: 50–60,000 chars.
2. Truncate to ~15k chars for the model.
3. System prompt demands **exact keys**: `name, summary, skills[], experience[{title,company,duration,details}], education[{degree,school,year}], projects[{name,description,technologies}], certifications[], technologies[], confidence 0–100`, with "never invent" rules.
4. `cleanResumeExtraction` — trim/truncate, dedupe skill strings (case-insensitive), coerce shapes, clamp confidence. Returns canonical shape stored in `resumes.parsed_*`.

### B. Job analysis (`POST /api/job-analyze`)
1. Validate: 50–60,000 chars.
2. System prompt demands **exact keys**: `required_skills, preferred_skills, technologies, responsibilities[], experience_requirements, education_requirements, keywords[], seniority`, with must-have vs. nice-to-have separation rules.
3. `cleanJobAnalysis` — same sanitization discipline. Stored in `job_analyses`.

### C. Compatibility (`POST /api/compatibility`) — NO AI
Deterministic, auditable (`api/_lib/scoring.js`, mirrored in `src/utils/scoring.js`):
- **Technical (40%)** — overlap of resume skills+technologies vs. job required_skills+technologies (case-insensitive, substring-fuzzy).
- **Experience (25%)** — years-of-experience heuristic (largest `N years` mention ratio) blended 60/40 with responsibility-keyword coverage in experience text.
- **Projects (15%)** — job-tech coverage in project technologies blended with project-count bonus (saturates at 3).
- **Education (10%)** — degree-level keyword check against requirement text.
- **Keywords (10%)** — overlap of resume skills vs. job keywords.
- `overall = round(weighted sum)`. Outputs: breakdown, matching/missing/strong/weak lists, templated recommendations, and a fixed disclaimer: *"Skill/requirement overlap only — not a probability of getting hired."*
- Empty job dimensions score neutrally (no penalty for unstated requirements).

### D. Interview generation (`POST /api/interview-generate`)
- Input: JD + missing skills + role + count (3–15, default 8) + system-design flag.
- Prompt enforces categories `technical | behavioral | system_design | missing_skill | role_specific`, at least one question per missing skill, system design **only when role-relevant** unless forced.
- `cleanInterviewQuestions` validates categories and caps at 15.

### E. Sample answers (`POST /api/interview-answer`)
- One question → `{ sample_answer (120–220 words, STAR for behavioral), improvement_tips (2–4 bullets) }`, with honesty guardrails (no fabricated credentials).

## 3. Evaluation

- **Unit tests** (`tests/`): weighted-sum identity, strong/weak overlap behavior, missing-skill detection, schema cleaning (dedupe/clamp/coercion), JSON fence/trailing-comma repair, validator + URL edge cases.
- **Manual eval checklist**: run 3 synthetic resumes × 2 synthetic jobs; verify technical=100 when skills cover requirements; verify missing list matches hand-counted gaps; verify disclaimer present in UI + API payload.
- **Failure modes**: empty model response → public "retry" error; malformed JSON → repair-or-error; 401/403 → "check server key"; 429 → "retry shortly". AI failures on save paths degrade gracefully (job/resume still saved; analysis can be retried).

## 4. Multimodal note

The shared client supports OpenAI-style `image_url` content parts (as used in sibling projects for OCR+vision extraction). CareerPilot AI ships text-first; resume-file uploads are stored privately and their pasted text is extracted — the architecture accepts a future `imageBase64` input without changing the sanitization contract.
