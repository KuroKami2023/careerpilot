import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { generateInterviewQuestions, generateAnswer } from '../lib/api.js';
import { CATEGORY_LABELS } from '../utils/constants.js';
import EmptyState from '../components/EmptyState.jsx';

export default function Interview() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState('');
  const [jobText, setJobText] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [missingSkills, setMissingSkills] = useState('');
  const [includeSystemDesign, setIncludeSystemDesign] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [answerBusy, setAnswerBusy] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [j, s] = await Promise.all([
          supabase.from('jobs').select('id, title, company, raw_description').order('updated_at', { ascending: false }),
          supabase.from('interview_sessions').select('*').order('created_at', { ascending: false }).limit(10),
        ]);
        setJobs(j.data || []);
        setSessions(s.data || []);
      } catch (err) {
        setError(err.message || 'Could not load.');
      }
    }
    load();
  }, []);

  async function handleJobSelect(id) {
    setJobId(id);
    const j = jobs.find((x) => x.id === id);
    if (j) {
      setJobText(j.raw_description || '');
      setRoleTitle(j.title || '');
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!jobText.trim() || jobText.trim().length < 20) {
      setError('Provide a job description (at least 20 characters).');
      return;
    }
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error('You must be signed in.');

      const missing = missingSkills.split(',').map((s) => s.trim()).filter(Boolean);
      const ai = await generateInterviewQuestions({
        jobDescription: jobText.trim(),
        missingSkills: missing,
        roleTitle: roleTitle.trim(),
        count: 8,
        includeSystemDesign,
      });

      const { data: session, error: sErr } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: userId,
          job_id: jobId || null,
          title: `${roleTitle.trim() || 'Interview'} prep — ${new Date().toLocaleDateString()}`,
          focus_areas: missing,
          include_system_design: includeSystemDesign,
        })
        .select('*')
        .single();
      if (sErr) throw sErr;

      const rows = ai.questions.map((q, i) => ({ session_id: session.id, category: q.category, question: q.question, skill_tag: q.skill_tag || '', sort_order: i }));
      const { data: saved, error: qErr } = await supabase.from('interview_questions').insert(rows).select('*');
      if (qErr) throw qErr;

      setActiveSession(session);
      setQuestions(saved || []);
      setSessions((prev) => [session, ...prev].slice(0, 10));
      setNotice(`Generated ${saved?.length || 0} questions.`);
    } catch (err) {
      setError(err.message || 'Question generation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenSession(session) {
    setError('');
    try {
      const { data, error: err } = await supabase.from('interview_questions').select('*').eq('session_id', session.id).order('sort_order');
      if (err) throw err;
      setActiveSession(session);
      setQuestions(data || []);
    } catch (err) {
      setError(err.message || 'Could not open session.');
    }
  }

  async function handleAnswer(q) {
    setAnswerBusy(q.id);
    setError('');
    try {
      const ai = await generateAnswer({ question: q.question, roleTitle: activeSession?.title || roleTitle, category: q.category });
      const { data, error: err } = await supabase
        .from('interview_questions')
        .update({ sample_answer: ai.sample_answer, improvement_tips: ai.improvement_tips })
        .eq('id', q.id)
        .select('*')
        .single();
      if (err) throw err;
      setQuestions((prev) => prev.map((x) => (x.id === q.id ? data : x)));
    } catch (err) {
      setError(err.message || 'Answer generation failed.');
    } finally {
      setAnswerBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interview preparation</h1>
        <p className="mt-1 text-sm text-slate-500">Technical, behavioral, system-design (when relevant), missing-skill, and role-specific questions — with sample answers on demand.</p>
      </div>

      <form onSubmit={handleGenerate} className="card space-y-3 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="i-job">Base on saved job (optional)</label>
            <select id="i-job" className="input" value={jobId} onChange={(e) => handleJobSelect(e.target.value)}>
              <option value="">Custom description…</option>
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} · {j.company}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="i-role">Role title</label>
            <input id="i-role" className="input" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Frontend Engineer" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="i-desc">Job description</label>
          <textarea id="i-desc" className="input min-h-[140px] font-mono !text-xs" value={jobText} onChange={(e) => setJobText(e.target.value)} placeholder="Paste the job description…" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="i-missing">Missing skills to probe (comma-separated)</label>
            <input id="i-missing" className="input" value={missingSkills} onChange={(e) => setMissingSkills(e.target.value)} placeholder="Docker, GraphQL" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={includeSystemDesign} onChange={(e) => setIncludeSystemDesign(e.target.checked)} />
            Force system-design questions
          </label>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Generating…' : 'Generate questions'}</button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <h2 className="font-semibold text-slate-900">Recent sessions</h2>
          {sessions.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">None yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => handleOpenSession(s)} className={`w-full rounded-lg px-2 py-1.5 text-left hover:bg-slate-100 ${activeSession?.id === s.id ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600'}`}>
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="md:col-span-2">
          {!activeSession ? (
            <EmptyState title="No session open" hint="Generate questions above, or open a recent session." />
          ) : (
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-900">{activeSession.title}</h2>
              {questions.map((q) => (
                <div key={q.id} className="card p-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{CATEGORY_LABELS[q.category] || q.category}</span>
                    {q.skill_tag ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500">{q.skill_tag}</span> : null}
                  </div>
                  <p className="mt-2 font-medium text-slate-900">{q.question}</p>
                  {q.sample_answer ? (
                    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      <p className="font-semibold">Sample answer</p>
                      <p className="mt-1 whitespace-pre-wrap">{q.sample_answer}</p>
                      {q.improvement_tips ? (
                        <>
                          <p className="mt-2 font-semibold">How to improve</p>
                          <p className="mt-1 whitespace-pre-wrap">{q.improvement_tips}</p>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <button type="button" className="btn-secondary mt-2 !px-3 !py-1.5 text-xs" onClick={() => handleAnswer(q)} disabled={answerBusy === q.id}>
                      {answerBusy === q.id ? 'Writing answer…' : 'Generate sample answer'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
