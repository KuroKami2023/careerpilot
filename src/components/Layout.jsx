import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/resumes', label: 'Resumes' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/match', label: 'Match Score' },
  { to: '/interview', label: 'Interview Prep' },
  { to: '/applications', label: 'Tracker' },
  { to: '/demo', label: 'Demo Mode' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout({ children }) {
  return <LayoutShell>{children}</LayoutShell>;
}

// react-router Layout route wrapper (uses Outlet)
export function LayoutShell({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      {/* Slim bespoke accent bar: ink rule with gold hairline */}
      <div className="bg-brand-900">
        <div className="h-1 bg-brand-900" />
        <div className="h-px bg-gold-400/80" />
      </div>
      <header className="sticky top-0 z-10 border-b bg-paper-card/95 backdrop-blur" style={{ borderColor: '#e7dfcf' }}>
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/dashboard" className="group flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-900 font-display text-lg text-paper shadow-sm ring-1 ring-gold-400/60 transition-transform duration-150 group-hover:-translate-y-px">
              C
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[17px] font-bold tracking-tight text-ink">
                CareerPilot
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gold-600">
                Career Journal
              </span>
            </span>
          </NavLink>
          <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-900 font-semibold text-paper shadow-sm'
                      : 'text-stone-600 hover:bg-paper-deep hover:text-ink'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <span className="hidden max-w-[220px] truncate font-display text-xs italic text-stone-500 md:block">
            {user?.email}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-secondary inline-flex shrink-0 items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </header>
      <main className="page-enter mx-auto max-w-6xl px-4 py-6">{children || <Outlet />}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-8">
        <div className="rule-double pt-3 text-xs text-stone-400">
          <span className="font-display italic">Colophon — </span>
          Compatibility scores measure skill/requirement overlap — not a probability of getting hired. Your data stays
          private to your account.
        </div>
      </footer>
    </div>
  );
}
