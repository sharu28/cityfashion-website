type SectionTitleProps = {
  eyebrow: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
};

export function SectionTitle({ eyebrow, title, body, action }: SectionTitleProps) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-xl space-y-3">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[var(--text-soft)]">{eyebrow}</p>
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--text-strong)] md:text-4xl">
          {title}
        </h2>
        {body ? <p className="max-w-lg text-sm leading-6 text-[var(--text-soft)] md:text-base">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}
