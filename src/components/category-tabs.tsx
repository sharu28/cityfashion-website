import Link from "next/link";

import { populatedCategories } from "@/lib/catalog";

type CategoryTabsProps = {
  activeSlug?: string;
  className?: string;
};

const chipBase =
  "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap border px-4 text-xs font-medium uppercase tracking-[0.08em] transition-colors";

export function CategoryTabs({ activeSlug, className = "" }: CategoryTabsProps) {
  const tabs = [
    { slug: "all", name: "All", href: "/#all-styles" },
    ...populatedCategories.map((category) => ({
      slug: category.slug,
      name: category.name,
      href: `/category/${category.slug}`,
    })),
  ];

  return (
    <nav aria-label="Categories" className={className}>
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 sm:px-6 lg:px-10">
        {tabs.map((tab) => {
          const isActive = tab.slug === activeSlug;
          return (
            <li key={tab.slug}>
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`${chipBase} ${
                  isActive
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--ink)] bg-white text-[var(--ink)] hover:bg-[var(--fill)]"
                }`}
              >
                {tab.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
