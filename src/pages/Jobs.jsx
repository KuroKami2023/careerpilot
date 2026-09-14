import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { analyzeJob, importJobUrl } from '../lib/api.js';
import { validateJobDescription } from '../utils/resumeText.js';
import { formatDate, truncate } from '../utils/format.js';
import EmptyState from '../components/EmptyState.jsx';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.from('jobs').select('*').order('updated_at', { ascending: false });
      if (err) throw err;
      setJobs(data || []);
    } catch (err) {
      setError(err.message || 'Could not load jobs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleImport() {
    setError('');
    setNotice('');
    if (!url.trim()) {
      setError('Paste a public job URL first.');
      return;
    }
    setImporting(true);
    try {
      const result = await importJobUrl(url.trim());
      if (result.imported) {
        setDescription(result.description || '');
        if (result.title && !title) setTitle(result.title);
        setNotice('Imported readable text from that page. Review it below — pasting manually always works as fallback.');
      } else {
        setError(result.message || 'Could not import. Please paste the description manually.');
      }
    } catch (err) {
      setError(err.message || 'Import failed. Please paste the description manually.');
    } finally {
      setImporting(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    const validation = validateJobDescription(description);
    if (validation) {
      setError(validation);
      return;
    }
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured.');
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('You must be signed in.');

      const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          user_id: userId,
          title: title.trim() || 'Untitled role',
          company: company.trim(),
          location: location.trim(),
          salary_text: salary.trim(),
          source_url: url.trim() || null,
          raw_description: description.trim(),
        })
        .select('id')
        .single();
      if (jobErr) throw jobErr;

      // AI analysis (server-side). Failure still leaves the saved job.
      try {
        const ai = await analyzeJob({ description: description.trim(), title: title.trim(), company: company.trim() });
        await supabase.from('job_analyses').insert({ job_id: job.id, user_id: userId, ...ai.analysis, raw_ai: ai.analysis });
        setNotice('Job saved and analyzed with AI.');
      } catch (aiErr) {
        setNotice(`Job saved, but AI analysis failed (${aiErr.message}). Open the job to retry.`);
      }

      setTitle('');
      setCompany('');
      setLocation('');
      setSalary('');
      setUrl('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err.message || 'Could not save job.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this job and its analyses?')) return;
    try {
      const { error: err } = await supabase.from('jobs').delete().eq('id', id);
      if (err) throw err;
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete job.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
        <p className="mt-1 text-sm text-slate-500">Paste a description or import a public posting URL (manual paste always works as fallback).</p>
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="font-semibold text-slate-900">Import from public URL (optional)</h2>
        <p className="text-xs text-slate-500">
          Only public postings, fetched once server-side with a normal user agent. Login-walled, paywalled, or
          bot-protected pages are not bypassed — paste the text instead.
        </p>
        <div className="flex gap-2">
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/jobs/123" inputMode="url" />
          <button type="button" className="btn-secondary shrink-0" onClick={handleImport} disabled={importing}>
            {importing ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-3 p-5">
        <h2 className="font-semibold text-slate-900">Save a job</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="job-title">Position</label>
            <input id="job-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Frontend Engineer" />
          </div>
          <div>
            <label className="label" htmlFor="job-company">Company</label>
            <input id="job-company" className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
          </div>
          <div>
            <label className="label" htmlFor="job-location">Location</label>
            <input id="job-location" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote / City" />
          </div>
          <div>
            <label className="label" htmlFor="job-salary">Salary (if provided)</label>
            <input id="job-salary" className="input" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="$120k–$150k" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="job-desc">Job description</label>
          <textarea id="job-desc" className="input min-h-[180px] font-mono !text-xs" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Paste the full job description…" />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Analyzing & saving…' : 'Analyze & save job'}</button>
      </form>

      <div>
        <h2 className="mb-2 font-semibold text-slate-900">Saved jobs</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : jobs.length === 0 ? (
          <EmptyState title="No jobs yet" hint="Save your first posting above, or try Demo Mode." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {jobs.map((j) => (
              <li key={j.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/jobs/${j.id}`} className="font-semibold text-brand-700 hover:underline">{j.title || 'Untitled role'}</Link>
                    <p className="text-sm text-slate-500">{j.company} {j.location ? `· ${j.location}` : ''}</p>
                  </div>
                  <button type="button" onClick={() => handleDelete(j.id)} className="btn-secondary !px-2 !py-1 text-xs">Delete</button>
                </div>
                <p className="mt-2 text-sm text-slate-600">{truncate(j.raw_description, 200)}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(j.updated_at)}{j.salary_text ? ` · ${j.salary_text}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
