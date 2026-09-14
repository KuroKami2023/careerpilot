import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { extractResume } from '../lib/api.js';
import SkillBadges from '../components/SkillBadges.jsx';

function TextListEditor({ label, items, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  return (
    <div>
      <span className="label">{label}</span>
      <SkillBadges skills={items} tone="neutral" emptyText="None yet" />
      <div className="mt-2 flex gap-2">
        <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={() => {
            const v = draft.trim();
            if (!v) return;
            onChange([...items, v]);
            setDraft('');
          }}
        >
          Add
        </button>
      </div>
      {items.length > 0 ? (
        <button type="button" className="mt-1 text-xs text-slate-400 hover:underline" onClick={() => onChange(items.slice(0, -1))}>
          Remove last
        </button>
      ) : null}
    </div>
  );
}

export default function ResumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error: err } = await supabase.from('resumes').select('*').eq('id', id).single();
        if (err) throw err;
        setResume(data);
        setForm({
          title: data.title || '',
          raw_text: data.raw_text || '',
          parsed_name: data.parsed_name || '',
          parsed_summary: data.parsed_summary || '',
          parsed_skills: data.parsed_skills || [],
          parsed_technologies: data.parsed_technologies || [],
          parsed_certifications: data.parsed_certifications || [],
        });
      } catch (err) {
        setError(err.message || 'Could not load resume.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from('resumes')
        .update({
          title: form.title,
          raw_text: form.raw_text,
          parsed_name: form.parsed_name,
          parsed_summary: form.parsed_summary,
          parsed_skills: form.parsed_skills,
          parsed_technologies: form.parsed_technologies,
          parsed_certifications: form.parsed_certifications,
          extraction_source: 'manual',
        })
        .eq('id', id);
      if (err) throw err;
      setNotice('Saved.');
    } catch (err) {
      setError(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReExtract() {
    setError('');
    setNotice('');
    if (!form.raw_text || form.raw_text.trim().length < 50) {
      setError('Need at least 50 characters of resume text to re-extract.');
      return;
    }
    setExtracting(true);
    try {
      const ai = await extractResume(form.raw_text.trim());
      const ex = ai.extraction;
      setForm((f) => ({
        ...f,
        parsed_name: ex.name || f.parsed_name,
        parsed_summary: ex.summary || f.parsed_summary,
        parsed_skills: ex.skills?.length ? ex.skills : f.parsed_skills,
        parsed_technologies: ex.technologies?.length ? ex.technologies : f.parsed_technologies,
        parsed_certifications: ex.certifications?.length ? ex.certifications : f.parsed_certifications,
      }));
      await supabase
        .from('resumes')
        .update({
          parsed_name: ex.name,
          parsed_summary: ex.summary,
          parsed_skills: ex.skills,
          parsed_experience: ex.experience,
          parsed_education: ex.education,
          parsed_projects: ex.projects,
          parsed_certifications: ex.certifications,
          parsed_technologies: ex.technologies,
          extraction_confidence: ex.confidence,
          extraction_source: 'ai',
        })
        .eq('id', id);
      setNotice(`Re-extracted with AI (confidence ${ex.confidence}/100). Review and save.`);
    } catch (err) {
      setError(err.message || 'AI extraction failed.');
    } finally {
      setExtracting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    try {
      if (resume?.file_path) await supabase.storage.from('resumes').remove([resume.file_path]);
      const { error: err } = await supabase.from('resumes').delete().eq('id', id);
      if (err) throw err;
      navigate('/resumes');
    } catch (err) {
      setError(err.message || 'Could not delete.');
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!form) return <p className="text-sm text-rose-600">{error || 'Not found.'}</p>;

  return (
    <div className="space-y-4">
      <Link to="/resumes" className="text-sm text-brand-600 hover:underline">← All resumes</Link>
      <h1 className="text-2xl font-bold text-slate-900">Edit resume</h1>

      <form onSubmit={handleSave} className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="f-title">Title</label>
          <input id="f-title" className="input" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="f-name">Name</label>
            <input id="f-name" className="input" value={form.parsed_name} onChange={(e) => set('parsed_name', e.target.value)} />
          </div>
          <div>
            <label className="label">Extraction confidence</label>
            <p className="text-sm text-slate-600">{resume?.extraction_confidence ?? 0}/100 · source: {resume?.extraction_source}</p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="f-summary">Summary</label>
          <textarea id="f-summary" className="input min-h-[90px]" value={form.parsed_summary} onChange={(e) => set('parsed_summary', e.target.value)} />
        </div>
        <TextListEditor label="Skills" items={form.parsed_skills} onChange={(v) => set('parsed_skills', v)} placeholder="e.g. React" />
        <TextListEditor label="Technologies" items={form.parsed_technologies} onChange={(v) => set('parsed_technologies', v)} placeholder="e.g. PostgreSQL" />
        <TextListEditor label="Certifications" items={form.parsed_certifications} onChange={(v) => set('parsed_certifications', v)} placeholder="e.g. AWS Cloud Practitioner" />
        <div>
          <label className="label" htmlFor="f-raw">Raw text (source of truth for re-extraction)</label>
          <textarea id="f-raw" className="input min-h-[160px] font-mono !text-xs" value={form.raw_text} onChange={(e) => set('raw_text', e.target.value)} />
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          <button type="button" className="btn-secondary" onClick={handleReExtract} disabled={extracting}>
            {extracting ? 'Extracting…' : 'Re-extract with AI'}
          </button>
          <button type="button" className="btn-secondary !border-rose-200 !text-rose-600" onClick={handleDelete}>Delete</button>
        </div>
      </form>

      {(resume?.parsed_experience?.length > 0 || resume?.parsed_projects?.length > 0 || resume?.parsed_education?.length > 0) ? (
        <div className="card space-y-4 p-5">
          <h2 className="font-semibold text-slate-900">Structured detail (from last AI extraction)</h2>
          {resume.parsed_experience?.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Experience</h3>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {resume.parsed_experience.map((e, i) => (
                  <li key={i}><strong>{e.title}</strong>{e.company ? ` · ${e.company}` : ''}{e.duration ? ` (${e.duration})` : ''}<br />{e.details}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {resume.parsed_projects?.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Projects</h3>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {resume.parsed_projects.map((p, i) => (
                  <li key={i}><strong>{p.name}</strong> — {p.description} {(p.technologies || []).join(', ')}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {resume.parsed_education?.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Education</h3>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {resume.parsed_education.map((e, i) => (
                  <li key={i}>{e.degree}{e.school ? ` · ${e.school}` : ''}{e.year ? ` (${e.year})` : ''}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
