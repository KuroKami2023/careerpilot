# PRIVACY.md — CareerPilot AI

## Principles

1. **Resumes are private.** Only the owning account can read/write them (RLS + private storage). No public resume URLs are ever created.
2. **No training use.** User resumes, job descriptions, and interview data are sent to NVIDIA's inference endpoint only to fulfill the user's request. We do not fine-tune models on user data, and no resume content is shared with third parties beyond the inference call and Supabase storage the user controls.
3. **Minimal collection.** Account email + user-provided career content only. No trackers, no ad SDKs.
4. **Transparency.** Compatibility scores are labeled as skill/requirement overlap with visible weights — never hiring probabilities.

## Data inventory

| Data | Where | Access |
|---|---|---|
| Auth identity | Supabase Auth | User + project admins |
| Profile row | `profiles` (RLS) | Owner only |
| Resume text + extraction | `resumes` (RLS) | Owner only |
| Resume files | Private `resumes` bucket | Owner only (authenticated) |
| Jobs + analyses | `jobs`, `job_analyses` (RLS) | Owner only |
| Applications | `applications` (RLS) | Owner only |
| Interview data | `interview_sessions`, `interview_questions` (RLS) | Owner only |

Prompts sent to NVIDIA contain only the text needed for the task (resume/JD/question), truncated to ~15k chars. API keys and other users' data are never included.

## User rights

- **Access/export** — all content is viewable in-app; Supabase table export is available to the user on request.
- **Correction** — every extracted field is editable (ResumeDetail page; re-extraction available).
- **Deletion** — Settings → *Delete all my data* removes resumes (+ stored files), jobs, analyses, applications, sessions/questions, and the profile row after typing `DELETE`. Auth-user deletion (full account removal) requires a project admin; contact the deployer with your account email.
- **Demo mode** — fully synthetic, in-browser only; nothing is stored or transmitted.

## Retention

Data is retained until the user deletes it. Backups follow Supabase's platform policy (Free tier). There is no separate analytics retention because no analytics pipeline exists.
