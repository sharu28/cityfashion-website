type SectionTitleProps = {
  eyebrow: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
  invert?: boolean;
};

export function SectionTitle({ eyebrow, title, body, action, invert = false }: SectionTitleProps) {
  return (
    <div className="flex flex-col gap-5 border-t border-current/15 pt-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        <p className={`text-[0.68rem] font-black uppercase tracking-[0.22em] ${invert ? "text-white/58" : "text-[var(--text-soft)]"}`}>
          {eyebrow}
        </p>
        <h2 className={`catalog-heading text-balance text-4xl font-black leading-[0.95] md:text-6xl ${invert ? "text-white" : "text-[var(--text-strong)]"}`}>
          {title}
        </h2>
        {body ? (
          <p className={`max-w-xl text-pretty text-sm leading-6 md:text-base ${invert ? "text-white/68" : "text-[var(--text-soft)]"}`}>
            {body}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
