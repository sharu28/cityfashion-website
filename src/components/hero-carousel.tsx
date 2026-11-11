"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import { buildWhatsAppLink } from "@/lib/catalog";

/** How long each style shows before the hero moves to the next one. */
export const HERO_SLIDE_MS = 5000;
/** Each panel changes a little after the one to its left, so the change runs across the hero. */
const PANEL_STAGGER_MS = 220;
const FADE_MS = 1000;

export type HeroSlide = {
  slug: string;
  title: string;
  image: string;
  price: string;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const current = slides[active];

  // Restarts after every change, so a tapped style gets its full time on screen.
  useEffect(() => {
    if (paused || count < 2 || prefersReducedMotion()) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % count), HERO_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [paused, count, active]);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative bg-[var(--ink)]"
      onPointerEnter={(event) => event.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* One photo on a phone; three side by side on a computer, each moving on to the next style. */}
      <div className="grid h-[min(82svh,700px)] grid-cols-1 sm:h-auto sm:aspect-[16/10] sm:grid-cols-3 lg:aspect-auto lg:h-[min(86vh,880px)]">
        {[0, 1, 2].map((panel) => {
          const shown = count > 0 ? (active + panel) % count : 0;
          const delay = panel * PANEL_STAGGER_MS;
          return (
            <div key={panel} className={`relative overflow-hidden ${panel > 0 ? "hidden sm:block" : ""}`}>
              {slides.map((slide, index) => {
                const isShown = index === shown;
                // The new photo fades in on top; the old one waits under it until the fade ends.
                const timing: CSSProperties = {
                  transitionDuration: isShown ? `${FADE_MS}ms` : "0ms",
                  transitionDelay: `${isShown ? delay : delay + FADE_MS}ms`,
                };
                return (
                  <Image
                    key={slide.slug}
                    src={slide.image}
                    alt=""
                    aria-hidden
                    fill
                    preload={panel === 0 && index === 0}
                    {...(panel === 0 && index === 0 ? {} : { loading: "lazy" as const })}
                    sizes="(max-width: 640px) 100vw, 34vw"
                    style={timing}
                    className={`object-cover object-top transition-[opacity,transform] ease-out ${
                      isShown ? "hero-drift z-10 opacity-100" : "z-0 opacity-0"
                    }`}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-20 hidden bg-gradient-to-r from-black/35 via-transparent to-transparent sm:block" />

      <div className="absolute inset-x-0 bottom-0 z-30 px-4 pb-6 text-white sm:px-6 sm:pb-10 lg:px-10 lg:pb-12">
        <p className="label text-white/85">Wholesale ladies wear · Colombo 11</p>
        <h1
          id="hero-title"
          className="mt-3 max-w-2xl text-[2.6rem] font-semibold leading-[1] tracking-[-0.03em] sm:text-6xl lg:text-[5.5rem]"
        >
          Fresh styles for your shop
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/85 sm:text-base">
          Order from 6 pieces a style. Our staff call to confirm delivery and payment.
        </p>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <Link
              href="#new-arrivals"
              className="inline-flex min-h-12 items-center justify-center bg-white px-6 text-sm font-semibold text-[var(--ink)]"
            >
              Shop new styles
            </Link>
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center border border-white/70 px-6 text-sm font-semibold text-white hover:bg-white/10"
            >
              Ask on WhatsApp
            </a>
          </div>

          {current ? (
            <div className="flex flex-col gap-1 lg:items-end">
              <Link
                href={`/products/${current.slug}`}
                aria-label={`See ${current.title} · ${current.price}`}
                className="flex min-h-11 min-w-0 max-w-full items-center gap-3 text-sm text-white"
              >
                <span className="shrink-0 whitespace-nowrap tabular-nums text-white/60">
                  {pad(active + 1)} / {pad(count)}
                </span>
                <span className="min-w-0 truncate font-semibold underline-offset-4 hover:underline">{current.title}</span>
                <span className="shrink-0 whitespace-nowrap text-white/75">{current.price}</span>
                <span aria-hidden className="shrink-0">
                  →
                </span>
              </Link>
              {count > 1 ? (
                <div className="flex items-center gap-1">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.slug}
                      type="button"
                      aria-label={`Show style ${index + 1} of ${count}`}
                      aria-current={index === active ? "true" : undefined}
                      onClick={() => setActive(index)}
                      className="flex h-9 items-center px-0.5"
                    >
                      <span aria-hidden className="relative block h-[2px] w-8 overflow-hidden bg-white/30 sm:w-10">
                        {index === active ? (
                          // Fills over the time this style is on screen; stops while the hero is paused.
                          <span
                            key={active}
                            className="hero-progress absolute inset-0 bg-white"
                            style={{ animationDuration: `${HERO_SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                          />
                        ) : index < active ? (
                          <span className="absolute inset-0 bg-white/70" />
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
