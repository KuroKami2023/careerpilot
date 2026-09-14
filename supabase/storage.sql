-- ============================================================
-- CareerPilot AI — Supabase Storage (private `resumes` bucket)
-- SHARED-PROJECT SAFE: policy names are bucket-prefixed so they never
-- collide with the other 4 apps' storage policies on storage.objects.
-- 1. Run this whole file in SQL Editor (bucket creation included).
--    (Or Dashboard → Storage → New bucket → name: resumes, PRIVATE,
--     5MB limit, allowed MIME: application/pdf,text/plain,
--     application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document)
-- File layout used by the app: resumes/<user_id>/<resume_id>/<filename>
-- NEVER make this bucket public. The app reads files via signed URLs
-- or authenticated downloads scoped to the owning user.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

drop policy if exists "resumes_storage_insert_own" on storage.objects;
create policy "resumes_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "resumes_storage_select_own" on storage.objects;
create policy "resumes_storage_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "resumes_storage_update_own" on storage.objects;
create policy "resumes_storage_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "resumes_storage_delete_own" on storage.objects;
create policy "resumes_storage_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
