const ICONS = {
  Resumes: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Jobs: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Applications: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  default: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
};

function iconFor(label) {
  if (!label) return ICONS.default;
  const hit = Object.keys(ICONS).find((k) => label.toLowerCase().includes(k.toLowerCase()));
  return ICONS[hit] || ICONS.default;
}

export default function StatCard({ label, value, hint }) {
  return (
    <div className="card card-hover p-4">
      <div className="h-0.5 w-8 rounded-full bg-gold-400" aria-hidden="true" />
      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
        <span className="text-brand-700">{iconFor(label)}</span>
        {label}
      </div>
      <div className="tnum mt-1 font-display text-3xl font-bold tracking-tight text-ink">{value}</div>
      {hint ? <div className="mt-1 text-xs italic text-stone-500" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{hint}</div> : null}
    </div>
  );
}
