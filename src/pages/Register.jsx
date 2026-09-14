import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function BrandPanel() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-brand-900 px-8 py-10 text-paper md:px-12">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(600px 300px at 20% 0%, rgba(209,153,56,0.18), transparent 60%)' }} />
      <div>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper font-display text-lg text-brand-900 ring-1 ring-gold-400/70">C</span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold tracking-tight">CareerPilot</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gold-300">Career Journal</span>
          </span>
        </div>
        <p className="kicker mt-10 !text-gold-300">New chapter — First edition</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-snug tracking-tight md:text-4xl">
          Begin your application archive.
        </h2>
        <div className="mt-4 h-px w-14 bg-gold-400" aria-hidden="true" />
        <ul className="mt-6 space-y-3 text-sm leading-relaxed text-paper/85">
          <li className="flex gap-2.5">
            <svg className="mt-0.5 shrink-0 text-gold-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            One shelf for every resume and role.
          </li>
          <li className="flex gap-2.5">
            <svg className="mt-0.5 shrink-0 text-gold-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            Transparent scores you can audit line by line.
          </li>
          <li className="flex gap-2.5">
            <svg className="mt-0.5 shrink-0 text-gold-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            Interview notes filed beside each pursuit.
          </li>
        </ul>
      </div>
      <p className="mt-10 font-display text-sm italic text-paper/60">
        Free tiers only — Supabase Free, Vercel Hobby, and a free AI endpoint.
      </p>
    </div>
  );
}

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await signUp(email.trim(), password);
      if (err) throw err;
      setInfo('Account created. Check your email to confirm, then sign in. One account works on every app.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      if (/already (registered|exists|been registered)/i.test(msg)) {
        setInfo('This email already has an account — one account works on every app. Taking you to sign in…');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-4 py-10">
        <div className="card page-enter w-full max-w-md p-6 md:p-8">
          <p className="kicker">Register</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">Create your account</h1>
          <p className="mt-1 font-display text-sm italic text-stone-500">Free tiers only — Supabase Free + Vercel Hobby + NVIDIA free endpoint.</p>
          <div className="rule-double mt-4" aria-hidden="true" />
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" />
            </div>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            {info ? <p className="rounded-lg bg-brand-50 p-2.5 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">{info}</p> : null}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </form>
          <div className="mt-4 text-sm">
            <Link to="/login" className="font-semibold text-brand-800 hover:underline">Already have an account? Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
