import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { APPLICATION_STATUSES } from '../utils/constants.js';
import { formatDate } from '../utils/format.js';

const EMPTY_FORM = {
  company: '',
  position: '',
  job_url: '',
  salary_text: '',
  status: 'Saved',
  date_applied: '',
  follow_up_date: '',
  interview_dates: '',
  notes: '',
  job_id: '',
  resume_id: '',
};

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [a, j, r] = await Promise.all([
        supabase.from('applications').select('*').order('updated_at', { ascending: false }),
        supabase.from('jobs').select('id, title, company').order('updated_at', { ascending: false }),
        supabase.from('resumes').select('id, title').order('updated_at', { ascending: false }),
      ]);
      if (a.error) throw a.error;
      setApps(a.data || []);
      setJobs(j.data || []);
      setResumes(r.data || []);
    } catch (err) {
      setError(err.message || 'Could not load applications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => (filter === 'All' ? apps : apps.filter((a) => a.status === filter)), [apps, filter]);

  const statusCounts = useMemo(() => {
    const counts = { All: apps.length };
    for (const s of APPLICATION_STATUSES) counts[s] = apps.filter((a) => a.status === s).length;
    return counts;
  }, [apps]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function startEdit(app) {
    setEditing(app.id);
    setForm({
      company: app.company || '',
      position: app.position || '',
      job_url: app.job_url || '',
      salary_text: app.salary_text || '',
      status: app.status || 'Saved',
      date_applied: app.date_applied || '',
      follow_up_date: app.follow_up_date || '',
      interview_dates: Array.isArray(app.interview_dates) ? app.interview_dates.join(', ') : '',
      notes: app.notes || '',
      job_id: app.job_id || '',
      resume_id: app.resume_id || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!form.company.trim() || !form.position.trim()) {
      setError('Company and position are required.');
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('You must be signed in.');
      const payload = {
        user_id: userId,
        company: form.company.trim(),
        position: form.position.trim(),
        job_url: form.job_url.trim() || null,
        salary_text: form.salary_text.trim(),
        status: form.status,
        date_applied: form.date_applied || null,
        follow_up_date: form.follow_up_date || null,
        interview_dates: form.interview_dates.split(',').map((s) => s.trim()).filter(Boolean),
        notes: form.notes.trim(),
        job_id: form.job_id || null,
        resume_id: form.resume_id || null,
      };
      if (editing) {
        const { error: err } = await supabase.from('applications').update(payload).eq('id', editing);
        if (err) throw err;
        setNotice('Application updated.');
      } else {
        const { error: err } = await supabase.from('applications').insert(payload);
        if (err) throw err;
        setNotice('Application added.');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err.message || 'Could not save application.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this application?')) return;
    try {
      const { error: err } = await supabase.from('applications').delete().eq('id', id);
      if (err) throw err;
      setApps((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete.');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application tracker</h1>
        <p className="mt-1 text-sm text-slate-500">Saved → Applied → Interview → Technical Interview → Offer (or Rejected/Withdrawn).</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['All', ...APPLICATION_STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card grid gap-3 p-5 md:grid-cols-2">
        <h2 className="font-semibold text-slate-900 md:col-span-2">{editing ? 'Edit application' : 'Add application'}</h2>
        <div>
          <label className="label" htmlFor="a-company">Company *</label>
          <input id="a-company" className="input" value={form.company} onChange={(e) => set('company', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="a-position">Position *</label>
          <input id="a-position" className="input" value={form.position} onChange={(e) => set('position', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="a-url">Posting URL</label>
          <input id="a-url" className="input" value={form.job_url} onChange={(e) => set('job_url', e.target.value)} inputMode="url" />
        </div>
        <div>
          <label className="label" htmlFor="a-salary">Salary (if provided)</label>
          <input id="a-salary" className="input" value={form.salary_text} onChange={(e) => set('salary_text', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="a-status">Status</label>
          <select id="a-status" className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {APPLICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="a-applied">Date applied</label>
          <input id="a-applied" type="date" className="input" value={form.date_applied} onChange={(e) => set('date_applied', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="a-interviews">Interview dates (comma-separated)</label>
          <input id="a-interviews" className="input" value={form.interview_dates} onChange={(e) => set('interview_dates', e.target.value)} placeholder="2026-09-15, 2026-09-22" />
        </div>
        <div>
          <label className="label" htmlFor="a-followup">Follow-up date</label>
          <input id="a-followup" type="date" className="input" value={form.follow_up_date} onChange={(e) => set('follow_up_date', e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="a-job">Linked job</label>
          <select id="a-job" className="input" value={form.job_id} onChange={(e) => set('job_id', e.target.value)}>
            <option value="">None</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} · {j.company}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="a-resume">Linked resume</label>
          <select id="a-resume" className="input" value={form.resume_id} onChange={(e) => set('resume_id', e.target.value)}>
            <option value="">None</option>
            {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="a-notes">Notes</label>
          <textarea id="a-notes" className="input min-h-[70px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>
        {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-600 md:col-span-2">{notice}</p> : null}
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Update' : 'Add application'}</button>
          {editing ? <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button> : null}
        </div>
      </form>

      <div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState title="No applications here" hint="Add one above or change the status filter." />
        ) : (
          <ul className="space-y-2">
            {filtered.map((a) => (
              <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{a.position} <span className="font-normal text-slate-500">· {a.company}</span></p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Applied: {formatDate(a.date_applied)} · Follow-up: {formatDate(a.follow_up_date)}
                    {a.salary_text ? ` · ${a.salary_text}` : ''}
                    {typeof a.match_score === 'number' ? ` · match ${a.match_score}` : ''}
                  </p>
                  {a.notes ? <p className="mt-1 text-sm text-slate-600">{a.notes}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={a.status} />
                  <button type="button" className="btn-secondary !px-2 !py-1 text-xs" onClick={() => startEdit(a)}>Edit</button>
                  <button type="button" className="btn-secondary !px-2 !py-1 text-xs" onClick={() => handleDelete(a.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
