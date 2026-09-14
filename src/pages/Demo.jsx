import { useMemo, useState } from 'react';
import { DEMO_RESUMES, DEMO_JOBS, DEMO_QUESTIONS } from '../utils/demoData.js';
import { computeCompatibility } from '../utils/scoring.js';
import { ScoreDonut, MatchBars } from '../components/MatchCharts.jsx';
import SkillBadges from '../components/SkillBadges.jsx';
import { CATEGORY_LABELS } from '../utils/constants.js';

function demoResumeProfile(d) {
  return {
    skills: d.parsed.skills,
    technologies: d.parsed.technologies,
    experience: d.parsed.experience,
    education: d.parsed.education,
    projects: d.parsed.projects,
  };
}

function demoJobProfile(d) {
  return {
    required_skills: d.analysis.required_skills,
    preferred_skills: d.analysis.preferred_skills,
    technologies: d.analysis.technologies,
    responsibilities: d.analysis.responsibilities,
    experience_requirements: d.analysis.experience_requirements,
    education_requirements: d.analysis.education_requirements,
    keywords: d.analysis.keywords,
  };
}

function SectionHeading({ kicker, title, icon }) {
  return (
    <div>
      <p className="kicker flex items-center gap-1.5">
        {icon}
        {kicker}
      </p>
      <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
      <div className="rule-double mt-3" aria-hidden="true" />
    </div>
  );
}

export default function Demo() {
  const [resumeKey, setResumeKey] = useState(DEMO_RESUMES[0].key);
  const [jobKey, setJobKey] = useState(DEMO_JOBS[0].key);

  const resume = DEMO_RESUMES.find((r) => r.key === resumeKey);
  const job = DEMO_JOBS.find((j) => j.key === jobKey);

  const compat = useMemo(
    () => computeCompatibility(demoResumeProfile(resume), demoJobProfile(job)),
    [resume, job],
  );

  return (
    <div className="page-enter space-y-5">
      <div className="border-b pb-5" style={{ borderColor: '#e7dfcf' }}>
        <p className="kicker">Specimen gallery — No backend needed</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">Demo mode</h1>
        <p className="mt-2 max-w-2xl font-display text-[15px] italic leading-relaxed text-stone-500">
          Fully synthetic resumes and job descriptions — no upload needed, nothing leaves your browser on this page.
          Sign in to save real data and use AI extraction.
        </p>
      </div>

      <div className="card grid gap-3 p-5 md:grid-cols-2">
        <div>
          <label className="label" htmlFor="d-resume">Synthetic resume</label>
          <select id="d-resume" className="input" value={resumeKey} onChange={(e) => setResumeKey(e.target.value)}>
            {DEMO_RESUMES.map((r) => <option key={r.key} value={r.key}>{r.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="d-job">Synthetic job</label>
          <select id="d-job" className="input" value={jobKey} onChange={(e) => setJobKey(e.target.value)}>
            {DEMO_JOBS.map((j) => <option key={j.key} value={j.key}>{j.title} · {j.company}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card card-hover p-5 md:p-6">
          <SectionHeading
            kicker="Plate I — Resume"
            title={`${resume.parsed.name} — extracted resume`}
            icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
          />
          <p className="mt-3 font-display text-sm italic leading-relaxed text-stone-600">{resume.parsed.summary}</p>
          <h3 className="label mt-4">Skills</h3>
          <div className="mt-1"><SkillBadges skills={resume.parsed.skills} tone="neutral" /></div>
          <h3 className="label mt-4">Experience</h3>
          <ul className="stagger-list mt-2 space-y-2 text-sm text-stone-600">
            {resume.parsed.experience.map((e, i) => (
              <li key={i} className="border-l-2 pl-3 leading-relaxed" style={{ borderColor: '#d9cba6' }}>
                <strong className="font-display tracking-tight text-ink">{e.title}</strong> <span className="italic">· {e.company}</span> — {e.details}
              </li>
            ))}
          </ul>
        </div>
        <div className="card card-hover p-5 md:p-6">
          <SectionHeading
            kicker="Plate II — Role"
            title={`${job.title} · ${job.company}`}
            icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
          />
          <p className="tnum mt-3 text-xs uppercase tracking-[0.12em] text-stone-500">{job.location}{job.salary_text ? ` · ${job.salary_text}` : ''} · seniority: {job.analysis.seniority}</p>
          <h3 className="label mt-4">Required</h3>
          <div className="mt-1"><SkillBadges skills={job.analysis.required_skills} tone="missing" /></div>
          <h3 className="label mt-4">Preferred</h3>
          <div className="mt-1"><SkillBadges skills={job.analysis.preferred_skills} tone="neutral" /></div>
          <h3 className="label mt-4">Keywords</h3>
          <div className="mt-1"><SkillBadges skills={job.analysis.keywords} tone="neutral" /></div>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <SectionHeading
          kicker="Plate III — Reading"
          title="Compatibility (same transparent algorithm as the app)"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
        />
        <div className="mt-4"><ScoreDonut overall={compat.overall} /></div>
        <div className="mt-2"><MatchBars breakdown={compat.breakdown} weights={compat.weights} /></div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-brand-50/60 p-4 ring-1 ring-inset ring-brand-200">
            <h3 className="font-display text-sm font-bold tracking-tight text-brand-800">Matching ({compat.matching_skills.length})</h3>
            <div className="mt-2"><SkillBadges skills={compat.matching_skills} tone="match" /></div>
          </div>
          <div className="rounded-xl bg-[#faf3ec] p-4 ring-1 ring-inset" style={{ borderColor: '#e8c4b8' }}>
            <h3 className="font-display text-sm font-bold tracking-tight text-[#93392b]">Missing ({compat.missing_skills.length})</h3>
            <div className="mt-2"><SkillBadges skills={compat.missing_skills} tone="missing" /></div>
          </div>
        </div>
        <ul className="mt-4 list-none space-y-1.5 pl-0 text-sm leading-relaxed text-stone-600">
          {compat.recommendations.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="tnum font-display font-bold text-gold-600">{String(i + 1).padStart(2, '0')}</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t pt-2 font-display text-xs italic text-stone-400" style={{ borderColor: '#e7dfcf' }}>{compat.disclaimer}</p>
      </div>

      <div className="card p-5 md:p-6">
        <SectionHeading
          kicker="Appendix — Questions"
          title="Sample interview questions (synthetic)"
          icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
        />
        <ul className="stagger-list mt-4 space-y-2">
          {DEMO_QUESTIONS.map((q, i) => (
            <li key={i} className="lift rounded-lg border bg-paper-card p-3 text-sm" style={{ borderColor: '#ece4d1' }}>
              <span className="rounded-full bg-brand-900 px-2 py-0.5 text-xs font-semibold text-paper">{CATEGORY_LABELS[q.category]}</span>
              {q.skill_tag ? <span className="ml-2 rounded-full bg-paper-deep px-2 py-0.5 text-xs text-stone-500 ring-1 ring-inset" style={{ borderColor: '#e7dfcf' }}>{q.skill_tag}</span> : null}
              <p className="mt-1.5 font-display leading-relaxed text-ink">{q.question}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
