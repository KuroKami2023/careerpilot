import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../utils/format.js';

const STEPS = [
  { to: '/resumes', title: 'Add a resume', note: 'upload, paste, AI-extract, edit.' },
  { to: '/jobs', title: 'Save a job', note: 'paste or import a public URL, AI-analyze.' },
  { to: '/match', title: 'Score compatibility', note: 'transparent 40/25/15/10/10 overlap.' },
  { to: '/interview', title: 'Prep for interviews', note: 'questions + sample answers.' },
  { to: '/applications', title: 'Track applications', note: 'Saved → Offer.' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ resumes: 0, jobs: 0, applications: 0, sessions: 0 });
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [r, j, a, s] = await Promise.all([
          supabase.from('resumes').select('id', { count: 'exact', head: true }),
          supabase.from('jobs').select('id', { count: 'exact', head: true }),
          supabase.from('applications').select('id', { count: 'exact', head: true }),
          supabase.from('interview_sessions').select('id', { count: 'exact', head: true }),
        ]);
        const { data: apps } = await supabase
          .from('applications')
          .select('id, company, position, status, updated_at, match_score')
          .order('updated_at', { ascending: false })
          .limit(5);
        setCounts({
          resumes: r.count || 0,
          jobs: j.count || 0,
          applications: a.count || 0,
          sessions: s.count || 0,
        });
        setRecentApps(apps || []);
      } catch {
        // stay on zeros
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page-enter space-y-6">
      {/* Masthead */}
      <div className="border-b pb-5" style={{ borderColor: '#e7dfcf' }}>
        <p className="kicker">Career Journal — Dashboard</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="mt-2 max-w-2xl font-display text-[15px] italic leading-relaxed text-stone-500">
          Analyze resumes, decode job descriptions, score compatibility transparently, prep for interviews, and track
          every application.
        </p>
        {!isSupabaseConfigured() ? (
          <p className="mt-3 flex max-w-3xl gap-2.5 rounded-xl bg-gold-50 p-3 text-sm leading-relaxed text-gold-800 ring-1 ring-inset ring-gold-200">
            <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              Supabase is not configured yet — copy <span className="font-mono">.env.example</span> to{' '}
              <span className="font-mono">.env</span> and set <span className="font-mono">VITE_SUPABASE_URL</span> /{' '}
              <span className="font-mono">VITE_SUPABASE_ANON_KEY</span>. You can still explore{' '}
              <Link to="/demo" className="font-semibold underline">Demo Mode</Link> without an account backend.
            </span>
          </p>
        ) : null}
      </div>

      <div className="stagger-list grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Resumes" value={loading ? '…' : counts.resumes} hint="Parsed & editable" />
        <StatCard label="Jobs" value={loading ? '…' : counts.jobs} hint="Saved descriptions" />
        <StatCard label="Applications" value={loading ? '…' : counts.applications} hint="Across all statuses" />
        <StatCard label="Interview sessions" value={loading ? '…' : counts.sessions} hint="AI-generated prep" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5 md:p-6">
          <p className="kicker">Chapter I</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">Start here</h2>
          <div className="rule-double mt-3" aria-hidden="true" />
          <ol className="stagger-list mt-4 space-y-3 text-sm text-stone-600">
            {STEPS.map((s, i) => (
              <li key={s.to} className="flex items-start gap-3">
                <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-900 font-display text-xs font-bold text-paper">
                  {i + 1}
                </span>
                <span className="leading-relaxed">
                  <Link to={s.to} className="font-semibold text-brand-800 hover:underline">{s.title}</Link>
                  <span className="text-stone-500"> — {s.note}</span>
                </span>
              </li>
            ))}
          </ol>
          <Link to="/demo" className="btn-secondary mt-5 inline-flex items-center gap-2 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Try Demo Mode with synthetic data
          </Link>
        </div>
        <div className="card p-5 md:p-6">
          <p className="kicker">Chapter II</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">Recent applications</h2>
          <div className="rule-double mt-3" aria-hidden="true" />
          {recentApps.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No applications yet" hint="Save your first job, then track it from Saved to Offer." />
            </div>
          ) : (
            <ul className="stagger-list mt-4 space-y-2 text-sm">
              {recentApps.map((a) => (
                <li key={a.id} className="lift flex items-center justify-between gap-2 rounded-lg border bg-paper-card px-3 py-2" style={{ borderColor: '#ece4d1' }}>
                  <span className="truncate">
                    <strong className="font-display tracking-tight text-ink">{a.position || 'Untitled'}</strong> <span className="italic text-stone-500">· {a.company}</span>
                    {typeof a.match_score === 'number' ? <span className="tnum ml-2 rounded-full bg-paper-deep px-2 py-0.5 text-xs text-stone-500 ring-1 ring-inset" style={{ borderColor: '#e7dfcf' }}>match {a.match_score}</span> : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tnum text-xs text-stone-400">{formatDate(a.updated_at)}</span>
                    <StatusBadge status={a.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
