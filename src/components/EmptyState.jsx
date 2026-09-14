export default function EmptyState({ title, hint, action }) {
  return (
    <div className="card p-8 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-paper-deep ring-1" style={{ borderColor: '#e7dfcf' }} aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a2e22" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>
      <div className="mx-auto mt-3 h-px w-10 bg-gold-400" aria-hidden="true" />
      <h3 className="mt-2 font-display text-lg font-bold tracking-tight text-ink">{title}</h3>
      {hint ? <p className="mx-auto mt-1 max-w-md text-sm italic text-stone-500" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
