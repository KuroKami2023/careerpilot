const COLORS = {
  Saved: 'bg-stone-100 text-stone-700 ring-stone-300',
  Applied: 'bg-gold-100 text-gold-800 ring-gold-300',
  Interview: 'bg-brand-100 text-brand-800 ring-brand-200',
  'Technical Interview': 'bg-[#e9e6d3] text-[#5c5a2e] ring-[#d3cfae]',
  Offer: 'bg-brand-900 text-paper ring-brand-900',
  Rejected: 'bg-[#f7e4de] text-[#93392b] ring-[#e8c4b8]',
  Withdrawn: 'bg-paper-deep text-stone-600 ring-[#ddd2ba]',
};

const DOTS = {
  Saved: 'bg-stone-400',
  Applied: 'bg-gold-500',
  Interview: 'bg-brand-600',
  'Technical Interview': 'bg-[#8a8747]',
  Offer: 'bg-gold-400',
  Rejected: 'bg-[#c05b4a]',
  Withdrawn: 'bg-stone-300',
};

export default function StatusBadge({ status }) {
  const cls = COLORS[status] || 'bg-stone-100 text-stone-700 ring-stone-300';
  const dot = DOTS[status] || 'bg-stone-400';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}
