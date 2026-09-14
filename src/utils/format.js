export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function truncate(text, max = 220) {
  const s = String(text || '');
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export function matchBand(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return { label: 'No score', cls: 'bg-slate-100 text-slate-600' };
  if (n >= 75) return { label: 'Strong overlap', cls: 'bg-emerald-100 text-emerald-700' };
  if (n >= 50) return { label: 'Moderate overlap', cls: 'bg-blue-100 text-blue-700' };
  if (n >= 30) return { label: 'Partial overlap', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'Low overlap', cls: 'bg-rose-100 text-rose-700' };
}
