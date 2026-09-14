import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import useReveal from '../hooks/useReveal.js';

function Reveal({ children, className = '', delay = 0, id }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      id={id}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/* 3D tilt on pointer only. Sets CSS vars, never React state, so no
   rerenders. Disabled when the user prefers reduced motion. */
function useTilt(max = 7) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return { ref, onMove, onLeave };
}

function Wordmark() {
  return (
    <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="CareerPilot home">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-900 font-display text-lg text-paper shadow-sm ring-1 ring-gold-400/60 transition-transform duration-150 group-hover:-translate-y-px">
        C
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-bold tracking-tight text-ink">CareerPilot</span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gold-600">
          Career Journal
        </span>
      </span>
    </Link>
  );
}

const FEATURES = [
  {
    title: 'Resume upload and parsing',
    body: 'Upload a file or paste your resume text. Get structured skills, experience, education, and projects you can review and edit.',
    path: '/resumes',
    link: 'Open Resumes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    title: 'Job import and analysis',
    body: 'Paste a job description or import readable text from a public posting URL. Required skills and keywords come back broken out.',
    path: '/jobs',
    link: 'Open Jobs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="9" y1="12" x2="15" y2="12" />
      </svg>
    ),
  },
  {
    title: 'Match scoring with breakdown',
    body: 'Pick a resume and a job to see a transparent compatibility score with per category overlap across skills, experience, and projects.',
    path: '/match',
    link: 'Open Match Score',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    ),
  },
  {
    title: 'Interview question generation',
    body: 'Generate practice questions from a real job description, save sessions, and draft sample answers to rehearse out loud.',
    path: '/interview',
    link: 'Open Interview Prep',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: 'Application tracker with statuses',
    body: 'Move each application from Saved to Applied, Screening, Interview, and Offer with dates and notes linked to the resume you used.',
    path: '/applications',
    link: 'Open Tracker',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: 'Demo mode, no sign up',
    body: 'Explore specimen resumes, jobs, and a worked compatibility example instantly in your browser. No account and no data leaves the device.',
    path: '/demo',
    link: 'Try the demo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="6 3 20 12 6 21 6 3" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Upload your resume',
    body: 'Add a file or paste your text on the Resumes page. Review the parsed skills and experience, correct anything, and save.',
    path: '/resumes',
    cta: 'Go to Resumes',
  },
  {
    n: '02',
    title: 'Add a job',
    body: 'Paste the posting or import readable text from a public URL on the Jobs page. Check the extracted requirements before you trust them.',
    path: '/jobs',
    cta: 'Go to Jobs',
  },
  {
    n: '03',
    title: 'Get your match and prep',
    body: 'Score the pair on the Match page with a full category breakdown, then generate interview questions tied to that same job.',
    path: '/match',
    cta: 'Go to Match',
  },
];

const FAQS = [
  {
    q: 'Is it free?',
    a: 'Yes, free during preview. There are no paid tiers, no locked features, and no credit card. If that ever changes, this page will say so plainly.',
  },
  {
    q: 'Where is my data stored?',
    a: 'In your own private account in a hosted Postgres database (Supabase), protected by row level security so only you can read and write your resumes, jobs, applications, and interview sessions. Nothing is shared with other users.',
  },
  {
    q: 'What does the match score actually mean?',
    a: 'Only skill and requirement overlap. It measures how much of what the posting asks for appears in your resume, weighted across skills, technologies, experience, education, and projects. It is not a hiring probability or a ranking.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. CareerPilot runs entirely in your browser. Open it on any modern desktop or mobile browser, sign in, and start. There is nothing to download and no browser extension.',
  },
];

function FaqItem({ q, a, open, onToggle, index }) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;
  return (
    <div className="card overflow-hidden">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="font-display text-[16px] font-bold text-ink">{q}</span>
          <span
            aria-hidden="true"
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-ink transition-transform duration-200 ${
              open ? 'rotate-45 border-gold-500 bg-gold-50' : 'border-[#ddd2ba] bg-paper-card'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open}>
        <p className="px-5 pb-5 text-[14px] leading-relaxed text-stone-600">{a}</p>
      </div>
    </div>
  );
}

function HeroVisual() {
  const { ref, onMove, onLeave } = useTilt(7);
  return (
    <div className="tilt-scene w-full" onMouseMove={onMove} onMouseLeave={onLeave}>
      <div ref={ref} className="tilt relative">
        <div className="orb orb-gold" aria-hidden="true" />
        <figure className="img-frame relative overflow-hidden rounded-2xl">
          <img
            src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop"
            alt="A notebook and laptop on a quiet work desk"
            width="880"
            height="620"
            loading="eager"
            className="aspect-[880/620] w-full object-cover"
          />
          <span className="shine" aria-hidden="true" />
        </figure>
        <figure className="img-frame float-slow relative z-10 mx-6 -mt-10 ml-auto w-3/5 overflow-hidden rounded-xl md:mx-10">
          <img
            src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?q=80&w=800&auto=format&fit=crop"
            alt="A pen resting on an open notebook"
            width="560"
            height="380"
            loading="lazy"
            className="aspect-[560/380] w-full object-cover"
          />
        </figure>
        <figcaption className="mt-3 text-right text-[12.5px] italic leading-relaxed text-stone-500">
          A quiet desk beats twelve open tabs.
        </figcaption>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);
  const loggedIn = Boolean(user);

  return (
    <div className="min-h-screen">
      <div className="bg-brand-900" aria-hidden="true">
        <div className="h-1 bg-brand-900" />
        <div className="h-px bg-gold-400/80" />
      </div>

      <header className="sticky top-0 z-10 border-b bg-paper-card/95 backdrop-blur" style={{ borderColor: '#e7dfcf' }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Wordmark />
          <nav className="ml-4 hidden flex-1 items-center gap-1 text-sm md:flex" aria-label="Landing">
            <a href="#features" className="rounded-full px-3 py-1.5 text-stone-600 transition-colors hover:bg-paper-deep hover:text-ink">
              Features
            </a>
            <a href="#how-it-works" className="rounded-full px-3 py-1.5 text-stone-600 transition-colors hover:bg-paper-deep hover:text-ink">
              How it works
            </a>
            <a href="#faq" className="rounded-full px-3 py-1.5 text-stone-600 transition-colors hover:bg-paper-deep hover:text-ink">
              FAQ
            </a>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {loading ? null : loggedIn ? (
              <Link to="/dashboard" className="btn-primary !px-4 !py-2 text-sm">
                Open dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !px-3.5 !py-2 text-sm">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !px-4 !py-2 text-sm">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-6xl overflow-hidden px-4 pb-10 pt-12 md:pt-20" aria-labelledby="landing-hero">
          <div className="hero-mesh" aria-hidden="true" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <Reveal>
              <h1 id="landing-hero" className="font-display text-4xl font-bold leading-[1.06] tracking-tight text-ink md:text-[3.4rem]">
                Keep your job search in one honest journal.
              </h1>
              <p className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-stone-600">
                Parse your resume, score it against a posting, and rehearse answers. Skill overlap only, never hiring odds.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {loggedIn ? (
                  <Link to="/dashboard" className="btn-primary !px-5 !py-2.5 text-[15px]">
                    Open dashboard
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                ) : (
                  <>
                    <Link to="/register" className="btn-primary !px-5 !py-2.5 text-[15px]">
                      Get started free
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                    <Link to="/demo" className="btn-secondary !px-5 !py-2.5 text-[15px]">
                      Try the demo
                    </Link>
                  </>
                )}
              </div>
            </Reveal>

            <Reveal delay={120} className="w-full">
              <HeroVisual />
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12" aria-label="At a glance">
          <Reveal>
            <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border bg-[#e7dfcf] sm:grid-cols-3" style={{ borderColor: '#e7dfcf' }}>
              {[
                ['Free during preview', 'No tiers, no card, no catch.'],
                ['Private by default', 'Your data stays inside your account.'],
                ['No install', 'Runs in any modern browser.'],
              ].map(([term, def]) => (
                <div key={term} className="bg-paper-card px-5 py-4">
                  <dt className="font-display text-[15px] font-bold text-ink">{term}</dt>
                  <dd className="mt-0.5 text-[13px] text-stone-500">{def}</dd>
                </div>
              ))}
            </dl>
            {/* Demo entry lives in the hero CTAs above; not repeated here. */}
          </Reveal>
        </section>

        <section id="features" className="scroll-mt-24 border-t bg-paper-deep/50" style={{ borderColor: '#e7dfcf' }} aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <Reveal>
              <h2 id="features-heading" className="max-w-2xl font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Everything the hunt scatters, bound in one volume.
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-stone-600">
                Six working capabilities. Each one is a real page in the app.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Reveal className="md:col-span-2">
                <article className="card card-hover grid h-full gap-5 overflow-hidden p-0 sm:grid-cols-2">
                  <img
                    src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=1000&auto=format&fit=crop"
                    alt="Typing a resume on a laptop keyboard"
                    width="640"
                    height="520"
                    loading="lazy"
                    className="h-48 w-full object-cover sm:h-full"
                  />
                  <div className="flex flex-col p-5 pl-1 pr-6 sm:py-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-900 text-paper ring-1 ring-gold-400/50" aria-hidden="true">
                      {FEATURES[0].icon}
                    </span>
                    <h3 className="mt-4 font-display text-[19px] font-bold tracking-tight text-ink">{FEATURES[0].title}</h3>
                    <p className="mt-2 flex-1 text-[14px] leading-relaxed text-stone-600">{FEATURES[0].body}</p>
                    <Link
                      to={FEATURES[0].path}
                      className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-brand-900"
                    >
                      {FEATURES[0].link}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                </article>
              </Reveal>
              {FEATURES.slice(1, 3).map((f, i) => (
                <Reveal key={f.title} delay={(i + 1) * 70}>
                  <article className="card card-hover flex h-full flex-col p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-900 text-paper ring-1 ring-gold-400/50" aria-hidden="true">
                      {f.icon}
                    </span>
                    <h3 className="mt-4 font-display text-[17px] font-bold tracking-tight text-ink">{f.title}</h3>
                    <p className="mt-2 flex-1 text-[14px] leading-relaxed text-stone-600">{f.body}</p>
                    <Link
                      to={f.path}
                      className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-brand-900"
                    >
                      {f.link}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </article>
                </Reveal>
              ))}
              <Reveal>
                <article className="flex h-full flex-col rounded-xl bg-brand-900 p-5 text-paper shadow-lift ring-1 ring-gold-400/40">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper/10 text-gold-300 ring-1 ring-gold-400/40" aria-hidden="true">
                    {FEATURES[3].icon}
                  </span>
                  <h3 className="mt-4 font-display text-[17px] font-bold tracking-tight">{FEATURES[3].title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-paper/75">{FEATURES[3].body}</p>
                  <Link
                    to={FEATURES[3].path}
                    className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-gold-300 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-gold-200"
                  >
                    {FEATURES[3].link}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </article>
              </Reveal>
              {FEATURES.slice(4).map((f, i) => (
                <Reveal key={f.title} delay={(i + 1) * 70}>
                  <article className="card card-hover flex h-full flex-col p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-900 text-paper ring-1 ring-gold-400/50" aria-hidden="true">
                      {f.icon}
                    </span>
                    <h3 className="mt-4 font-display text-[17px] font-bold tracking-tight text-ink">{f.title}</h3>
                    <p className="mt-2 flex-1 text-[14px] leading-relaxed text-stone-600">{f.body}</p>
                    <Link
                      to={f.path}
                      className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-brand-900"
                    >
                      {f.link}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24" aria-labelledby="how-heading">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <Reveal>
                <h2 id="how-heading" className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                  Three entries, then you are underway.
                </h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-stone-600">
                  Scores are transparent overlap counts you can inspect category by category. Treat gaps as editing prompts, never as odds.
                </p>
                <img
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop"
                  alt="A tidy office desk set for applications"
                  width="560"
                  height="420"
                  loading="lazy"
                  className="img-frame mt-6 aspect-[560/420] w-full max-w-md rounded-2xl object-cover"
                />
              </Reveal>
              <ol className="divide-y divide-[#e7dfcf] border-y" style={{ borderColor: '#e7dfcf' }}>
                {STEPS.map((s, i) => (
                  <Reveal key={s.n} delay={i * 80}>
                    <li className="flex gap-5 py-6">
                      <span className="tnum font-display text-[15px] font-bold tracking-[0.12em] text-gold-600" aria-hidden="true">
                        {s.n}
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold tracking-tight text-ink">{s.title}</h3>
                        <p className="mt-1.5 max-w-lg text-[14px] leading-relaxed text-stone-600">{s.body}</p>
                        <Link
                          to={s.path}
                          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-800 underline decoration-gold-400 decoration-2 underline-offset-4 hover:text-brand-900"
                        >
                          {s.cta}
                          <span className="sr-only">, {s.title}</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </Link>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-24 border-t bg-paper-deep/50" style={{ borderColor: '#e7dfcf' }} aria-labelledby="faq-heading">
          <div className="mx-auto max-w-3xl px-4 py-14 md:py-20">
            <Reveal>
              <h2 id="faq-heading" className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
                Frequently asked questions.
              </h2>
            </Reveal>
            <div className="mt-8 space-y-3">
              {FAQS.map((f, i) => (
                <Reveal key={f.q} delay={i * 60}>
                  <FaqItem
                    q={f.q}
                    a={f.a}
                    index={i}
                    open={openFaq === i}
                    onToggle={() => setOpenFaq((cur) => (cur === i ? -1 : i))}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="final-cta" className="border-t" style={{ borderColor: '#e7dfcf' }}>
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <Reveal>
              <div className="overflow-hidden rounded-2xl bg-brand-900 px-6 py-12 text-center shadow-lift ring-1 ring-gold-400/40 md:px-12 md:py-16">
                <h2 id="final-cta" className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-paper md:text-4xl">
                  Your next role deserves better than scattered tabs.
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-paper/75">
                  Parse your resume, score it against a real posting, and walk into prep work. Free during preview, private to your account.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  {loggedIn ? (
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 text-[15px] font-bold text-brand-950 shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-gold-300"
                    >
                      Open dashboard
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="inline-flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 text-[15px] font-bold text-brand-950 shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-gold-300"
                      >
                        Get started free
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </Link>
                      <Link
                        to="/demo"
                        className="inline-flex items-center gap-2 rounded-lg border border-paper/30 px-5 py-2.5 text-[15px] font-semibold text-paper transition-all duration-150 hover:-translate-y-px hover:bg-paper/10"
                      >
                        Try the demo
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex flex-col gap-4 border-t pt-6 md:flex-row md:items-start md:justify-between" style={{ borderColor: '#e7dfcf' }}>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-900 font-display text-base text-paper ring-1 ring-gold-400/60" aria-hidden="true">
              C
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-bold tracking-tight text-ink">CareerPilot</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-gold-600">
                Career Journal
              </span>
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-stone-600" aria-label="Footer">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how-it-works" className="hover:text-ink">How it works</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
            {!loggedIn && (
              <>
                <Link to="/login" className="hover:text-ink">Sign in</Link>
                <Link to="/register" className="hover:text-ink">Get started</Link>
              </>
            )}
            {loggedIn && (
              <Link to="/dashboard" className="hover:text-ink">Dashboard</Link>
            )}
            <Link to="/demo" className="hover:text-ink">Demo</Link>
          </nav>
        </div>
        <p className="rule-double mt-6 pt-3 text-xs leading-relaxed text-stone-400">
          <span className="font-display italic">Colophon. </span>
          Compatibility scores measure skill and requirement overlap, not a probability of getting hired. Your data stays
          private to your account.
        </p>
      </footer>
    </div>
  );
}
