# DEPLOYMENT.md — CareerPilot AI (free tiers only)

Allowed: **Vercel Hobby + Supabase Free + NVIDIA free endpoint.** No AWS, no paid AI APIs, no paid DB/hosting.

## 1. Supabase (Free)

1. Create project at supabase.com (Free plan).
2. SQL Editor → paste + Run **`supabase/schema.sql`** (tables, indexes, triggers, RLS).
3. Storage → New bucket → name `resumes`, **private**, 5MB limit, MIME: `text/plain, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
4. SQL Editor → run the (commented) storage policies in **`supabase/storage.sql`** by uncommenting them.
5. Auth → enable Email provider; set Site URL to your Vercel domain (and `http://localhost:5175` for dev).
6. Copy: Project URL → `VITE_SUPABASE_URL`; anon public key → `VITE_SUPABASE_ANON_KEY`. (**Never** use the service-role key in the app.)

## 2. NVIDIA (free endpoint)

1. Get a free API key at build.nvidia.com.
2. Vercel project → Settings → Environment Variables → add **`NVIDIA_API_KEY`** (Production + Preview; server only — no `VITE_` prefix).

## 3. Vercel (Hobby)

1. Push this folder to GitHub, then Vercel → Add New Project → Import.
2. Framework preset: Vite. Build: `npm run build`. Output: `dist`.
3. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `NVIDIA_API_KEY`.
4. Deploy. `vercel.json` routes `/api/*` to functions and all else to `index.html`.

## 4. Verify

- `GET /api/health` → `{ ok: true, ai_configured: true }`.
- Register → add resume (paste Demo text) → save job → Match → Interview → Tracker.
- Confirm RLS: user A cannot read user B rows (test with two accounts).
- Confirm privacy: `resumes` bucket has **no** public access; files load only when signed in.

## 5. Local dev

```bash
cp .env.example .env   # fill values; NVIDIA_API_KEY here only for `vercel dev`
npm install
npm run dev            # Vite on :5175 (API routes need `vercel dev` or deployed preview)
npm test
```

Note: plain `vite dev` serves the frontend; `/api/*` works under `vercel dev` or after deployment. Demo mode works with no backend at all.
