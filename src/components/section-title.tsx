import Link from "next/link";

type SectionTitleProps = {
  title: string;
  /** Optional small line above or beside the title. */
  eyebrow?: string;
  body?: string;
  action?: React.ReactNode;
  seeAllHref?: string;
  invert?: boolean;
  as?: "h1" | "h2" | "h3";
  id?: string;
};

export function SectionTitle({
  title,
  eyebrow,
  body,
  action,
  seeAllHref,
  invert = false,
  as: Heading = "h2",
  id,
}: SectionTitleProps) {
  const soft = invert ? "text-white/70" : "text-[var(--text-soft)]";

  return (
    <div className="flex items-end justify-between gap-4 px-4 sm:px-6 lg:px-10">
      <div className="min-w-0 space-y-1">
        {eyebrow ? <p className={`label ${soft}`}>{eyebrow}</p> : null}
        <Heading id={id} className="label text-[0.8125rem]">
          {title}
        </Heading>
        {body ? <p className={`max-w-xl text-sm leading-6 ${soft}`}>{body}</p> : null}
      </div>
      {action}
      {seeAllHref ? (
        <Link href={seeAllHref} className="shrink-0 text-xs underline underline-offset-4">
          See all
        </Link>
      ) : null}
    </div>
  );
}
