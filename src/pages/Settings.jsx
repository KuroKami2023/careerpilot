import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchHealth } from '../lib/api.js';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState(null);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { error: err } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, full_name: fullName, headline: headline });
      if (err) throw err;
      setMessage('Profile saved.');
    } catch (err) {
      setError(err.message || 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckHealth() {
    try {
      setHealth(await fetchHealth());
    } catch (err) {
      setHealth({ ok: false, error: err.message });
    }
  }

  async function handleDeleteAccount() {
    const confirmText = window.prompt('Type DELETE to permanently remove all your resumes, jobs, applications, and interview data. This cannot be undone.');
    if (confirmText !== 'DELETE') return;
    setError('');
    setMessage('');
    try {
      // Delete child data first (RLS-scoped to own rows), then sign out.
      const { data: sessions } = await supabase.from('interview_sessions').select('id');
      if (sessions?.length) {
        await supabase.from('interview_questions').delete().in('session_id', sessions.map((s) => s.id));
      }
      await supabase.from('interview_sessions').delete().eq('user_id', user.id);
      await supabase.from('applications').delete().eq('user_id', user.id);
      await supabase.from('job_analyses').delete().eq('user_id', user.id);
      await supabase.from('jobs').delete().eq('user_id', user.id);
      const { data: resumes } = await supabase.from('resumes').select('file_path').eq('user_id', user.id);
      const paths = (resumes || []).map((r) => r.file_path).filter(Boolean);
      if (paths.length) await supabase.storage.from('resumes').remove(paths);
      await supabase.from('resumes').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      setMessage('Your data has been deleted. Signing you out…');
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Deletion failed. Some rows may remain — contact support with your user id.');
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings & privacy</h1>
        <p className="mt-1 text-sm text-slate-500">Signed in as {user?.email}. Resume data is private to your account and never used to train models.</p>
      </div>

      <form onSubmit={handleSaveProfile} className="card space-y-3 p-5">
        <h2 className="font-semibold text-slate-900">Profile</h2>
        <div>
          <label className="label" htmlFor="s-name">Full name</label>
          <input id="s-name" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="label" htmlFor="s-headline">Headline</label>
          <input id="s-headline" className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Frontend Engineer · React" />
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>

      <div className="card space-y-2 p-5">
        <h2 className="font-semibold text-slate-900">Service status</h2>
        <button type="button" className="btn-secondary" onClick={handleCheckHealth}>Check API health</button>
        {health ? <pre className="overflow-auto rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-600">{JSON.stringify(health, null, 2)}</pre> : null}
      </div>

      <div className="card space-y-2 border-rose-200 p-5">
        <h2 className="font-semibold text-rose-700">Delete my data</h2>
        <p className="text-sm text-slate-600">
          Permanently deletes all resumes (including stored files), jobs, analyses, applications, interview sessions,
          and your profile row. Auth user deletion must be done by a project admin if required.
        </p>
        <button type="button" className="btn-secondary !border-rose-200 !text-rose-600" onClick={handleDeleteAccount}>
          Delete all my data…
        </button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
    </div>
  );
}
