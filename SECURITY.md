# SECURITY.md — CareerPilot AI

## Threat model (Free-tier SaaS)

| Threat | Control |
|---|---|
| Cross-user data access | RLS on all 7 tables; storage folder-prefix policies; no service-role key in app code |
| NVIDIA key theft | Key lives only in server env (`NVIDIA_API_KEY`); never `VITE_`-prefixed, never imported by `src/`; health endpoint exposes only a boolean |
| Prompt-injection → stored XSS | AI outputs are JSON-sanitized (`schemas.js`); frontend renders as text (no `dangerouslySetInnerHTML` anywhere) |
| Malicious/oversized inputs | Validators cap strings (60k), arrays (counts + lengths), counts (3–15); body cap 1MB; image guard where applicable |
| SSRF via job-import URL | `validateJobUrl`: http(s) only, no credentials, rejects localhost/private RFC1918/link-local; 10s timeout; 500KB cap; HTML-only; single fetch, no crawl/JS/auth-bypass; 401/403/429 → manual-paste message |
| Abuse / cost exhaustion | Per-IP sliding-window limits (10–60/min by endpoint) + `X-RateLimit-Remaining`; low `max_tokens`; truncated prompts |
| Auth attacks | Supabase Auth (bcrypt passwords, email confirm, reset flow); PKCE sessions; protected routes redirect to `/login` |
| Public resume leaks | Private `resumes` bucket; no public URLs; file paths namespaced by `user_id` |
| Secret leakage in logs | `safeLogError` logs lengths + truncated messages only |

## Ownership validation

- Database is the authority: RLS policies require `auth.uid() = user_id` (or parent ownership for `interview_questions` / `job_analyses`).
- Frontend additionally scopes queries by signed-in user and confirms `getUser()` before inserts.
- Storage policies bind the first path segment to `auth.uid()`.

## AI output safety

- `extractJson` rejects non-JSON; `schemas.js` drops unknown keys, truncates strings, dedupes arrays, clamps numbers.
- Compatibility math is deterministic code, not model judgment — no hiring predictions anywhere (UI copy + tests enforce this).

## Residual risks / Hobby-tier notes

- In-memory rate limiting is per serverless instance (best-effort under burst scaling). For stricter abuse control, add Supabase-based counters or Vercel WAF rules.
- No CSP headers configured by default — add via `vercel.json` headers if embedding untrusted content (currently none is embedded).
- Auth-user row deletion (Settings → delete data) removes app data; full `auth.users` removal requires a project admin/service key and is documented in `PRIVACY.md`.
