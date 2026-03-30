import Link from "next/link";

type WhatsAppButtonProps = {
  href: string;
  label: string;
  variant?: "light" | "dark" | "brand";
};

export function WhatsAppButton({ href, label, variant = "brand" }: WhatsAppButtonProps) {
  const styles =
    variant === "dark"
      ? "bg-[var(--text-strong)] text-white"
      : variant === "light"
        ? "bg-white text-[var(--text-strong)]"
        : "bg-[var(--whatsapp)] text-white shadow-[0_14px_30px_rgba(37,150,95,0.28)]";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition hover:-translate-y-0.5 ${styles}`}
    >
      {label}
    </Link>
  );
}
