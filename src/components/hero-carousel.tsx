"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buildWhatsAppLink } from "@/lib/catalog";

/** How long each style shows before the hero moves to the next one. */
export const HERO_SLIDE_MS = 5000;

export type HeroSlide = {
  slug: string;
  title: string;
  image: string;
  price: string;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
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
      className="bg-[var(--hero-tint)]"
      onPointerEnter={(event) => event.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto grid max-w-[1440px] md:grid-cols-[1fr_1.05fr] md:h-[min(82vh,780px)]">
        <div className="relative aspect-[4/5] overflow-hidden md:order-last md:aspect-auto md:h-full">
          {slides.map((slide, index) => (
            <Image
              key={slide.slug}
              src={slide.image}
              alt=""
              aria-hidden
              fill
              preload={index === 0}
              {...(index === 0 ? {} : { loading: "lazy" as const })}
              sizes="(max-width: 768px) 100vw, 52vw"
              // The new photo fades in on top; the old one stays under it until the fade ends, so the tint never shows through.
              className={`object-cover object-top transition-opacity ${
                index === active ? "z-10 opacity-100 duration-1000 ease-out" : "z-0 opacity-0 duration-0 delay-1000"
              }`}
            />
          ))}

          <p className="absolute right-4 top-4 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center leading-none text-[var(--ink)] sm:h-28 sm:w-28 md:right-8 md:top-8">
            <span className="text-[0.65rem] uppercase tracking-[0.14em]">From</span>
            <span className="mt-1 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">6 pcs</span>
            <span className="mt-1 text-[0.65rem] uppercase tracking-[0.14em]">a style</span>
          </p>

          {current ? (
            <Link
              href={`/products/${current.slug}`}
              aria-label={`See ${current.title} · ${current.price}`}
              className="absolute bottom-4 left-4 inline-flex min-h-11 items-center gap-3 bg-white px-4 text-sm text-[var(--ink)] md:bottom-8 md:left-8"
            >
              <span className="font-semibold">{current.title}</span>
              <span className="text-[var(--text-soft)]">{current.price}</span>
              <span aria-hidden>→</span>
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col justify-center px-4 py-10 sm:px-6 md:py-12 lg:px-14">
          <p className="label flex items-center gap-3 text-[var(--text-soft)]">
            <span aria-hidden className="h-px w-8 bg-current" />
            Wholesale ladies wear · Colombo 11
          </p>
          <h1
            id="hero-title"
            className="mt-5 max-w-xl text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.03em] text-[var(--ink)] sm:text-6xl lg:text-[5.25rem]"
          >
            Fresh styles for your shop
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[var(--text-soft)] lg:text-lg">
            Order from 6 pieces a style. Our staff call to confirm delivery and payment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#new-arrivals"
              className="inline-flex min-h-12 items-center justify-center bg-[var(--ink)] px-7 text-sm font-semibold text-white hover:bg-black"
            >
              Shop new styles
            </Link>
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center border border-[var(--ink)] px-7 text-sm font-semibold text-[var(--ink)] hover:bg-white/60"
            >
              Ask on WhatsApp
            </a>
          </div>

          {count > 1 ? (
            <div className="mt-10 flex items-center gap-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.slug}
                  type="button"
                  aria-label={`Show style ${index + 1} of ${count}`}
                  aria-current={index === active ? "true" : undefined}
                  onClick={() => setActive(index)}
                  className="group flex h-11 items-center px-1"
                >
                  <span
                    aria-hidden
                    className={`block h-[3px] transition-all duration-300 ${
                      index === active ? "w-10 bg-[var(--ink)]" : "w-6 bg-[var(--ink)]/25 group-hover:bg-[var(--ink)]/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
