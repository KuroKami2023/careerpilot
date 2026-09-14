export default function SkillBadges({ skills = [], tone = 'match', emptyText = 'None' }) {
  if (!skills || skills.length === 0) return <span className="text-sm italic text-stone-400" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{emptyText}</span>;
  const cls =
    tone === 'match'
      ? 'bg-brand-50 text-brand-800 border-brand-200'
      : tone === 'missing'
        ? 'bg-[#faf0ea] text-[#93392b] border-[#e8c4b8]'
        : 'bg-paper-deep text-stone-700 border-[#ddd2ba]';
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <span key={s} className={`rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${cls}`}>
          {s}
        </span>
      ))}
    </div>
  );
}
