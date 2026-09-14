import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { extractResume } from '../lib/api.js';
import { readResumeFileText, validateResumeText } from '../utils/resumeText.js';
import { formatDate } from '../utils/format.js';
import EmptyState from '../components/EmptyState.jsx';

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.from('resumes').select('*').order('updated_at', { ascending: false });
      if (err) throw err;
      setResumes(data || []);
    } catch (err) {
      setError(err.message || 'Could not load resumes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setNotice('');
    if (!f) return;
    try {
      const { text, needsPaste } = await readResumeFileText(f);
      if (text) {
        setRawText(text);
        setNotice(`Read ${text.length.toLocaleString()} characters from ${f.name}. Review below, then save.`);
      } else if (needsPaste) {
        setNotice(
          `${f.name} will be stored as-is. PDF/Word text cannot be reliably read in the browser — please paste the resume text below so AI extraction can run.`,
        );
      }
    } catch {
      setNotice('Could not read that file. Please paste the resume text below.');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    const validation = validateResumeText(rawText);
    if (validation) {
      setError(validation);
      return;
    }
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY first.');
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('You must be signed in.');

      // 1. AI extraction (server-side NVIDIA call)
      let extraction = null;
      try {
        const ai = await extractResume(rawText.trim());
        extraction = ai.extraction;
      } catch (aiErr) {
        // Fall back to manual: store raw text with empty structured fields
        setNotice(`AI extraction unavailable (${aiErr.message}). Saved raw text — you can edit details on the resume page.`);
      }

      // 2. Optional private file upload (never public)
      let filePath = null;
      let originalFilename = null;
      let newId = null;
      // Insert first to get an id for the storage path
      const insertPayload = {
        user_id: userId,
        title: title.trim() || 'Untitled resume',
        raw_text: rawText.trim(),
        parsed_name: extraction?.name || '',
        parsed_summary: extraction?.summary || '',
        parsed_skills: extraction?.skills || [],
        parsed_experience: extraction?.experience || [],
        parsed_education: extraction?.education || [],
        parsed_projects: extraction?.projects || [],
        parsed_certifications: extraction?.certifications || [],
        parsed_technologies: extraction?.technologies || [],
        extraction_confidence: extraction?.confidence || 0,
        extraction_source: extraction ? 'ai' : 'manual',
        original_filename: file?.name || null,
      };
      const { data: inserted, error: insertErr } = await supabase.from('resumes').insert(insertPayload).select('id').single();
      if (insertErr) throw insertErr;
      newId = inserted.id;

      if (file) {
        originalFilename = file.name;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
        filePath = `${userId}/${newId}/${safeName}`;
        const { error: upErr } = await supabase.storage.from('resumes').upload(filePath, file, { upsert: true });
        if (upErr) {
          setNotice((n) => `${n} File upload failed (${upErr.message}) — resume text is still saved.`.trim());
        } else {
          await supabase.from('resumes').update({ file_path: filePath, original_filename: originalFilename }).eq('id', newId);
        }
      }

      setTitle('');
      setRawText('');
      setFile(null);
      if (!notice) setNotice('Resume saved and extracted.');
      await load();
    } catch (err) {
      setError(err.message || 'Could not save resume.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id, filePath) {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    setError('');
    try {
      if (filePath) {
        await supabase.storage.from('resumes').remove([filePath]);
      }
      const { error: err } = await supabase.from('resumes').delete().eq('id', id);
      if (err) throw err;
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete resume.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Resumes</h1>
        <p className="mt-1 text-sm text-slate-500">Upload a file and/or paste text. AI extracts structure; you can edit everything.</p>
      </div>

      <form onSubmit={handleSave} className="card space-y-3 p-5">
        <h2 className="font-semibold text-slate-900">Add a resume</h2>
        <div>
          <label className="label" htmlFor="resume-title">Title</label>
          <input id="resume-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend resume — 2026" maxLength={200} />
        </div>
        <div>
          <label className="label" htmlFor="resume-file">File upload (optional, .txt/.md readable; .pdf/.docx stored + paste text)</label>
          <input id="resume-file" type="file" accept=".txt,.md,.pdf,.doc,.docx" onChange={handleFileChange} className="text-sm" />
        </div>
        <div>
          <label className="label" htmlFor="resume-text">Resume text</label>
          <textarea id="resume-text" className="input min-h-[180px] font-mono !text-xs" value={rawText} onChange={(e) => setRawText(e.target.value)} placeholder="Paste your resume here…" />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Extracting & saving…' : 'Extract & save resume'}
        </button>
      </form>

      <div>
        <h2 className="mb-2 font-semibold text-slate-900">Saved resumes</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : resumes.length === 0 ? (
          <EmptyState title="No resumes yet" hint="Add one above, or explore Demo Mode for synthetic examples." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {resumes.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/resumes/${r.id}`} className="font-semibold text-brand-700 hover:underline">{r.title}</Link>
                    <p className="mt-0.5 text-sm text-slate-500">{r.parsed_name || 'No name extracted'} · {formatDate(r.updated_at)}</p>
                  </div>
                  <button type="button" onClick={() => handleDelete(r.id, r.file_path)} className="btn-secondary !px-2 !py-1 text-xs">Delete</button>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{r.parsed_summary || r.raw_text?.slice(0, 200)}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(r.parsed_skills || []).slice(0, 6).map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
                  ))}
                  {(r.parsed_skills || []).length > 6 ? <span className="text-xs text-slate-400">+{r.parsed_skills.length - 6} more</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
