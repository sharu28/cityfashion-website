type SectionTitleProps = {
  eyebrow: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
  invert?: boolean;
};

export function SectionTitle({ eyebrow, title, body, action, invert = false }: SectionTitleProps) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-xl space-y-3">
        <p className={`text-[0.72rem] font-bold uppercase tracking-[0.18em] ${invert ? "text-white/58" : "text-[var(--text-soft)]"}`}>
          {eyebrow}
        </p>
        <h2 className={`text-balance text-3xl font-bold leading-[1.06] tracking-[-0.01em] md:text-5xl ${invert ? "text-white" : "text-[var(--text-strong)]"}`}>
          {title}
        </h2>
        {body ? (
          <p className={`max-w-lg text-pretty text-sm leading-6 md:text-base ${invert ? "text-white/68" : "text-[var(--text-soft)]"}`}>
            {body}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
