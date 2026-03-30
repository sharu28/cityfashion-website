type ProductBadgesProps = {
  badges: string[];
  categoryLabel?: string;
  invert?: boolean;
};

export function ProductBadges({ badges, categoryLabel, invert = false }: ProductBadgesProps) {
  const chipStyle = invert
    ? "border-white/18 bg-white/10 text-white"
    : "border-[var(--line)] bg-white/78 text-[var(--text-soft)]";

  const allBadges = categoryLabel ? [categoryLabel, ...badges] : badges;

  if (allBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {allBadges.map((badge) => (
        <span
          key={badge}
          className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] ${chipStyle}`}
        >
          {badge}
        </span>
      ))}
    </div>
  );
}
