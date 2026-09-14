# DATABASE.md — CareerPilot AI

Supabase PostgreSQL (Free tier). Full DDL + RLS in `supabase/schema.sql`; storage policies in `supabase/storage.sql`.

## Tables

### `profiles` (1:1 with `auth.users`)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK → `auth.users(id)` cascade | RLS owner = `auth.uid()` |
| `email`, `full_name`, `headline` | text | Optional display fields |
| `created_at`, `updated_at` | timestamptz | auto `updated_at` trigger |

### `resumes`
Stores raw text + canonical AI extraction + optional private file pointer.
- `user_id` → owner. `title`, `raw_text` (source of truth), `file_path` (`resumes/<uid>/<resumeId>/<file>`), `original_filename`.
- `parsed_name`, `parsed_summary`, `parsed_skills[]`, `parsed_experience[]`, `parsed_education[]`, `parsed_projects[]`, `parsed_certifications[]`, `parsed_technologies[]` (jsonb arrays).
- `extraction_confidence` 0–100, `extraction_source ∈ {ai, manual, demo, upload_ai}`.
- Indexes: `(user_id)`, `(updated_at desc)`.

### `jobs`
- `user_id`, `title`, `company`, `source_url` (nullable), `raw_description`, `location`, `salary_text`.

### `job_analyses`
One row per analysis run (history preserved; UI shows latest).
- `job_id` → `jobs` cascade, `user_id` (must also own parent job on insert).
- `required_skills[]`, `preferred_skills[]`, `technologies[]`, `responsibilities[]`, `experience_requirements`, `education_requirements`, `keywords[]`, `seniority`, `raw_ai` jsonb.

### `applications`
- `user_id`, nullable `job_id` (set null on job delete), nullable `resume_id`.
- `company*`, `position*`, `job_url`, `salary_text`.
- `status ∈ {Saved, Applied, Interview, Technical Interview, Offer, Rejected, Withdrawn}` (default `Saved`).
- `date_applied`, `interview_dates[]` (jsonb), `follow_up_date`, `notes`.
- `match_score` 0–100 (nullable snapshot), `match_breakdown` jsonb.

### `interview_sessions`
- `user_id`, nullable `job_id` / `resume_id`, `title`, `focus_areas[]`, `include_system_design`.

### `interview_questions`
- `session_id` → sessions cascade; `category ∈ {technical, behavioral, system_design, missing_skill, role_specific}`; `question`, `skill_tag`, `sample_answer`, `improvement_tips`, `sort_order`.

## RLS model

- Every table has RLS **enabled** with `select/insert/update/delete` policies scoped to `auth.uid() = user_id` (or `id` for profiles).
- `interview_questions` and `job_analyses` inserts additionally require ownership of the parent row (`session_id` / `job_id`).
- The app uses **only the anon key + user JWT** — no service-role key in code. Ownership is enforced by the database, and the API layer re-validates inputs but does not bypass RLS.
- `set_updated_at()` trigger keeps `updated_at` fresh on profiles/resumes/jobs/applications.

## Storage

- Private bucket `resumes` (5MB limit recommended; txt/md/pdf/doc/docx). Layout `resumes/<user_id>/<resume_id>/<filename>` so folder-prefix policies (`(storage.foldername(name))[1] = auth.uid()::text`) isolate users.
- **Never public.** No public URLs are created; downloads use authenticated access. See `SECURITY.md` / `PRIVACY.md`.
