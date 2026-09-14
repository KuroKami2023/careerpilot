import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { scoreCompatibility } from '../lib/api.js';
import { computeCompatibility } from '../utils/scoring.js';
import { SCORE_WEIGHT_LABELS } from '../utils/constants.js';
import { ScoreDonut, MatchRadar, MatchBars } from '../components/MatchCharts.jsx';
import SkillBadges from '../components/SkillBadges.jsx';

function resumeProfile(r) {
  return {
    skills: r?.parsed_skills || [],
    technologies: r?.parsed_technologies || [],
    experience: r?.parsed_experience || [],
    education: r?.parsed_education || [],
    projects: r?.parsed_projects || [],
  };
}

function jobProfile(a) {
  return {
    required_skills: a?.required_skills || [],
    preferred_skills: a?.preferred_skills || [],
    technologies: a?.technologies || [],
    responsibilities: a?.responsibilities || [],
    experience_requirements: a?.experience_requirements || '',
    education_requirements: a?.education_requirements || '',
    keywords: a?.keywords || [],
  };
}

export default function Match() {
  const [resumes, setResumes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [analyses, setAnalyses] = useState({});
  const [resumeId, setResumeId] = useState('');
  const [jobId, setJobId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [r, j] = await Promise.all([
          supabase.from('resumes').select('id, title, parsed_skills, parsed_technologies, parsed_experience, parsed_education, parsed_projects').order('updated_at', { ascending: false }),
          supabase.from('jobs').select('id, title, company').order('updated_at', { ascending: false }),
        ]);
        setResumes(r.data || []);
        setJobs(j.data || []);
        if (r.data?.length) setResumeId(r.data[0].id);
        if (j.data?.length) setJobId(j.data[0].id);
      } catch (err) {
        setError(err.message || 'Could not load data.');
      }
    }
    load();
  }, []);

  const selectedAnalysis = analyses[jobId];

  useEffect(() => {
    async function loadAnalysis() {
      if (!jobId) return;
      if (analyses[jobId]) return;
      try {
        const { data } = await supabase.from('job_analyses').select('*').eq('job_id', jobId).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (data) setAnalyses((prev) => ({ ...prev, [jobId]: data }));
      } catch {
        // ignore
      }
    }
    loadAnalysis();
  }, [jobId]);

  const canScore = useMemo(() => Boolean(resumeId && jobId && selectedAnalysis), [resumeId, jobId, selectedAnalysis]);

  async function handleScore() {
    setError('');
    setBusy(true);
    try {
      const resume = resumes.find((r) => r.id === resumeId);
      const fullResume = resume?.parsed_experience ? resume : (await supabase.from('resumes').select('*').eq('id', resumeId).single()).data;
      const payload = { resume: resumeProfile(fullResume), jobAnalysis: jobProfile(selectedAnalysis) };
      let compat;
      try {
        const apiRes = await scoreCompatibility(payload);
        compat = apiRes.compatibility;
      } catch {
        // Offline fallback: identical deterministic algorithm in the browser
        compat = computeCompatibility(payload.resume, payload.jobAnalysis);
      }
      setResult(compat);
    } catch (err) {
      setError(err.message || 'Scoring failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Compatibility score</h1>
        <p className="mt-1 text-sm text-slate-500">
          Transparent skill/requirement overlap — Technical 40% · Experience 25% · Projects 15% · Education 10% ·
          Keywords 10%. This is <strong>not</strong> a probability of getting hired.
        </p>
      </div>

      <div className="card grid gap-3 p-5 md:grid-cols-3">
        <div>
          <label className="label" htmlFor="m-resume">Resume</label>
          <select id="m-resume" className="input" value={resumeId} onChange={(e) => { setResumeId(e.target.value); setResult(null); }}>
            {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="m-job">Job</label>
          <select id="m-job" className="input" value={jobId} onChange={(e) => { setJobId(e.target.value); setResult(null); }}>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} · {j.company}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-primary w-full" onClick={handleScore} disabled={!canScore || busy}>
            {busy ? 'Scoring…' : 'Calculate match'}
          </button>
        </div>
      </div>

      {!selectedAnalysis && jobId ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          This job has no AI analysis yet. <Link to={`/jobs/${jobId}`} className="underline">Open the job</Link> and run analysis first.
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {result ? (
        <div className="space-y-4">
          <div className="card p-5">
            <ScoreDonut overall={result.overall} />
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              {SCORE_WEIGHT_LABELS.map((w) => (
                <span key={w.key} className="rounded-full bg-slate-100 px-2.5 py-1">{w.label}: {result.breakdown?.[w.key]}/100 (weight {w.weight}%)</span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900">Dimension breakdown</h2>
              <MatchBars breakdown={result.breakdown} weights={result.weights} />
            </div>
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900">Radar view</h2>
              <MatchRadar breakdown={result.breakdown} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h2 className="font-semibold text-emerald-700">Matching skills ({result.matching_skills?.length || 0})</h2>
              <div className="mt-2"><SkillBadges skills={result.matching_skills} tone="match" /></div>
              <h2 className="mt-4 font-semibold text-slate-900">Strong matches</h2>
              <div className="mt-2"><SkillBadges skills={result.strong_matches} tone="match" /></div>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold text-rose-700">Missing skills ({result.missing_skills?.length || 0})</h2>
              <div className="mt-2"><SkillBadges skills={result.missing_skills} tone="missing" /></div>
              <h2 className="mt-4 font-semibold text-slate-900">Weak / preferred gaps</h2>
              <div className="mt-2"><SkillBadges skills={result.weak_matches} tone="neutral" /></div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900">Recommendations</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {(result.recommendations || []).map((r, i) => <li key={i}>{r}</li>)}
            </ul>
            <p className="mt-3 text-xs text-slate-400">{result.disclaimer}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
