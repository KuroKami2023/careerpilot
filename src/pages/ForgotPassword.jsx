import { useState } from 'react';
import { Link } from 'react-router-dom';
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
        <p className="kicker mt-10 !text-gold-300">Lost &amp; found</p>
        <h2 className="mt-3 font-display text-3xl font-bold leading-snug tracking-tight md:text-4xl">
          A misplaced key shouldn’t end the story.
        </h2>
        <div className="mt-4 h-px w-14 bg-gold-400" aria-hidden="true" />
        <p className="mt-6 text-sm leading-relaxed text-paper/85">
          Enter the email on your account and we’ll send a reset link. Your journal — resumes, roles, and notes —
          will be waiting when you return.
        </p>
      </div>
      <p className="mt-10 font-display text-sm italic text-paper/60">
        “Check your inbox for the next page.”
      </p>
    </div>
  );
}

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const { error: err } = await resetPassword(email.trim());
      if (err) throw err;
      setMessage('Reset link sent. Check your inbox.');
    } catch (err) {
      setError(err.message || 'Could not send reset email.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-4 py-10">
        <div className="card page-enter w-full max-w-md p-6 md:p-8">
          <p className="kicker">Recovery</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">Reset password</h1>
          <div className="rule-double mt-4" aria-hidden="true" />
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-lg bg-brand-50 p-2.5 text-sm text-brand-800 ring-1 ring-inset ring-brand-200">{message}</p> : null}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <div className="mt-4 text-sm">
            <Link to="/login" className="font-semibold text-brand-800 hover:underline">Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
