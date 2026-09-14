import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { analyzeJob } from '../lib/api.js';
import SkillBadges from '../components/SkillBadges.jsx';

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data: j, error: jErr } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (jErr) throw jErr;
      setJob(j);
      const { data: a } = await supabase.from('job_analyses').select('*').eq('job_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      setAnalysis(a || null);
    } catch (err) {
      setError(err.message || 'Could not load job.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleReAnalyze() {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const ai = await analyzeJob({ description: job.raw_description, title: job.title, company: job.company });
      const { data, error: err } = await supabase
        .from('job_analyses')
        .insert({ job_id: id, user_id: userData?.user?.id, ...ai.analysis, raw_ai: ai.analysis })
        .select('*')
        .single();
      if (err) throw err;
      setAnalysis(data);
      setNotice('Re-analyzed with AI.');
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!job) return <p className="text-sm text-rose-600">{error || 'Not found.'}</p>;

  return (
    <div className="space-y-4">
      <Link to="/jobs" className="text-sm text-brand-600 hover:underline">← All jobs</Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
        <p className="text-sm text-slate-500">{job.company} {job.location ? `· ${job.location}` : ''} {job.salary_text ? `· ${job.salary_text}` : ''}</p>
        {job.source_url ? <a href={job.source_url} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">Original posting</a> : null}
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Job analysis</h2>
          <button type="button" className="btn-secondary !px-3 !py-1.5 text-xs" onClick={handleReAnalyze} disabled={busy}>
            {busy ? 'Analyzing…' : 'Re-analyze with AI'}
          </button>
        </div>
        {!analysis ? (
          <p className="mt-2 text-sm text-slate-500">No analysis saved yet — run AI analysis to extract skills, responsibilities, and keywords.</p>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Required skills</h3>
              <div className="mt-1"><SkillBadges skills={analysis.required_skills} tone="missing" /></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Preferred skills</h3>
              <div className="mt-1"><SkillBadges skills={analysis.preferred_skills} tone="neutral" /></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Technologies</h3>
              <div className="mt-1"><SkillBadges skills={analysis.technologies} tone="neutral" /></div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Keywords</h3>
              <div className="mt-1"><SkillBadges skills={analysis.keywords} tone="neutral" /></div>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-slate-700">Responsibilities</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {(analysis.responsibilities || []).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Experience</h3>
              <p className="text-sm text-slate-600">{analysis.experience_requirements || '—'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Education / Seniority</h3>
              <p className="text-sm text-slate-600">{analysis.education_requirements || '—'}{analysis.seniority ? ` · ${analysis.seniority}` : ''}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-slate-900">Raw description</h2>
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs text-slate-600">{job.raw_description}</pre>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/match" className="btn-primary text-sm">Score compatibility →</Link>
        <Link to="/interview" className="btn-secondary text-sm">Prep interview questions →</Link>
      </div>
    </div>
  );
}
