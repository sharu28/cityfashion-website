type ProductBadgesProps = {
  badges: string[];
  categoryLabel?: string;
  invert?: boolean;
};

export function ProductBadges({ badges, categoryLabel, invert = false }: ProductBadgesProps) {
  const chipStyle = invert
    ? "border-white/18 bg-white/10 text-white"
    : "border-[var(--line)] bg-[rgba(255,253,248,0.82)] text-[var(--text-soft)]";

  const allBadges = categoryLabel ? [categoryLabel, ...badges] : badges;

  if (allBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allBadges.map((badge) => (
        <span
          key={badge}
          className={`rounded-md border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] ${chipStyle}`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
