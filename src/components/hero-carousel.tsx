"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { buildWhatsAppLink } from "@/lib/catalog";

/** How long each style shows before the hero moves to the next one. */
export const HERO_SLIDE_MS = 5000;

export type HeroSlide = {
  slug: string;
  title: string;
  image: string;
  price: string;
};

/** Trial looks for the owner to compare; the chosen one stays and the rest go. */
export const HERO_VARIANTS = ["color", "full", "poster"] as const;
export type HeroVariant = (typeof HERO_VARIANTS)[number];

const tickerWords = ["New styles every week", "From 6 pcs a style", "Wholesale only", "131 Keyzer Street, Colombo 11", "Order on WhatsApp"];

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function useRotation(count: number) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Restarts after every change, so a tapped style gets its full time on screen.
  useEffect(() => {
    if (paused || count < 2 || prefersReducedMotion()) return;
    const timer = window.setTimeout(() => setActive((index) => (index + 1) % count), HERO_SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [paused, count, active]);

  const pauseProps = {
    onPointerEnter: (event: React.PointerEvent) => event.pointerType === "mouse" && setPaused(true),
    onPointerLeave: (event: React.PointerEvent) => event.pointerType === "mouse" && setPaused(false),
    onFocus: () => setPaused(true),
    onBlur: () => setPaused(false),
  };

  return { active, setActive, pauseProps };
}

function Ticker({ className }: { className: string }) {
  const words = [...tickerWords, ...tickerWords];
  return (
    <div aria-hidden className={`overflow-hidden whitespace-nowrap py-2.5 ${className}`}>
      <div className="marquee-track inline-flex">
        {words.map((word, index) => (
          <span key={index} className="label inline-flex items-center gap-6 px-3 text-[0.72rem]">
            {word}
            <span>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Markers({
  slides,
  active,
  onPick,
  tone,
}: {
  slides: HeroSlide[];
  active: number;
  onPick: (index: number) => void;
  tone: "dark" | "light";
}) {
  if (slides.length < 2) return null;
  const on = tone === "light" ? "bg-white" : "bg-[var(--ink)]";
  const off = tone === "light" ? "bg-white/35" : "bg-[var(--ink)]/25";
  return (
    <div className="flex items-center gap-1">
      {slides.map((slide, index) => (
        <button
          key={slide.slug}
          type="button"
          aria-label={`Show style ${index + 1} of ${slides.length}`}
          aria-current={index === active ? "true" : undefined}
          onClick={() => onPick(index)}
          className="flex h-11 items-center px-1"
        >
          <span aria-hidden className={`block h-[3px] transition-all duration-300 ${index === active ? `w-10 ${on}` : `w-6 ${off}`}`} />
        </button>
      ))}
    </div>
  );
}

function StyleLink({ slide, className }: { slide: HeroSlide; className: string }) {
  return (
    <Link href={`/products/${slide.slug}`} aria-label={`See ${slide.title} · ${slide.price}`} className={className}>
      <span className="font-semibold">{slide.title}</span>
      <span className="opacity-70">{slide.price}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}

function Badge({ className }: { className: string }) {
  return (
    <p className={`flex flex-col items-center justify-center rounded-full text-center leading-none ${className}`}>
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em]">From</span>
      <span className="mt-1 text-2xl font-black tracking-[-0.03em] sm:text-3xl">6 pcs</span>
      <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em]">a style</span>
    </p>
  );
}

/** Photos stacked in one frame; the new one fades in over the old one. */
function PhotoStack({
  slides,
  active,
  sizes,
  zoom = false,
  lead = true,
}: {
  slides: HeroSlide[];
  active: number;
  sizes: string;
  zoom?: boolean;
  /** Only the stack the buyer sees first preloads its first photo. */
  lead?: boolean;
}) {
  return (
    <>
      {slides.map((slide, index) => (
        <Image
          key={slide.slug}
          src={slide.image}
          alt=""
          aria-hidden
          fill
          preload={lead && index === 0}
          {...(lead && index === 0 ? {} : { loading: "lazy" as const })}
          sizes={sizes}
          className={`object-cover object-top transition-opacity ${
            index === active ? `z-10 opacity-100 duration-1000 ease-out ${zoom ? "ken-burns" : ""}` : "z-0 opacity-0 duration-0 delay-1000"
          }`}
        />
      ))}
    </>
  );
}

function Buttons({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="#new-arrivals" className={`inline-flex min-h-12 items-center justify-center rounded-full px-7 text-sm font-bold ${primary}`}>
        Shop new styles
      </Link>
      <a
        href={buildWhatsAppLink()}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex min-h-12 items-center justify-center rounded-full border-2 px-7 text-sm font-bold ${secondary}`}
      >
        Ask on WhatsApp
      </a>
    </div>
  );
}

function Headline({ className, accent }: { className: string; accent: ReactNode }) {
  return (
    <h1 id="hero-title" className={className}>
      Fresh styles for {accent}
    </h1>
  );
}

export function HeroCarousel({ slides, variant: initialVariant = "color" }: { slides: HeroSlide[]; variant?: HeroVariant }) {
  const { active, setActive, pauseProps } = useRotation(slides.length);
  const [variant, setVariant] = useState<HeroVariant>(initialVariant);

  // Trial only: ?hero=color|full|poster switches the look so the owner can compare.
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("hero");
    if (!asked || !(HERO_VARIANTS as readonly string[]).includes(asked)) return;
    const timer = window.setTimeout(() => setVariant(asked as HeroVariant), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const current = slides[active];

  if (variant === "full") {
    return (
      <section aria-labelledby="hero-title" className="bg-[var(--ink)] text-white" {...pauseProps}>
        <div className="relative h-[min(86svh,860px)] min-h-[560px] overflow-hidden">
          {/* One photo on a phone; three side by side on a computer so the clothes are not cropped to faces. */}
          <div className="absolute inset-0 grid md:grid-cols-3">
            {[0, 1, 2].map((offset) => (
              <div key={offset} className={`relative overflow-hidden ${offset > 0 ? "hidden md:block" : ""}`}>
                <PhotoStack
                  slides={slides}
                  active={(active + offset) % Math.max(slides.length, 1)}
                  sizes="(max-width: 768px) 100vw, 34vw"
                  zoom
                  lead={offset === 0}
                />
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 z-30 mx-auto max-w-[1440px] px-4 pb-8 sm:px-6 sm:pb-12 lg:px-10 lg:pb-14">
            <p className="label text-[#ffd84d]">Wholesale ladies wear · Colombo 11</p>
            <Headline
              className="mt-4 max-w-4xl text-[3.4rem] font-black uppercase leading-[0.86] tracking-[-0.04em] sm:text-8xl lg:text-[9rem]"
              accent={<span className="text-[#ffd84d]">your shop</span>}
            />
            <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <Buttons primary="bg-[#ffd84d] text-[var(--ink)]" secondary="border-white text-white hover:bg-white/10" />
              <div className="flex flex-col gap-1 lg:items-end">
                {current ? <StyleLink slide={current} className="inline-flex min-h-11 items-center gap-3 text-sm text-white" /> : null}
                <Markers slides={slides} active={active} onPick={setActive} tone="light" />
              </div>
            </div>
          </div>
          <Badge className="absolute right-4 top-4 z-30 h-24 w-24 rotate-[-10deg] bg-[#ffd84d] text-[var(--ink)] sm:right-8 sm:top-8 sm:h-28 sm:w-28" />
        </div>
        <Ticker className="bg-[#ffd84d] text-[var(--ink)]" />
      </section>
    );
  }

  if (variant === "poster") {
    const order = slides.map((_, index) => (index - active + slides.length) % slides.length);
    return (
      <section aria-labelledby="hero-title" className="overflow-hidden bg-[var(--ink)] text-white" {...pauseProps}>
        <Ticker className="border-b border-white/15 text-[#ffd84d]" />
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1fr] md:py-16 lg:px-10 lg:py-20">
          <div>
            <p className="label text-white/60">Wholesale ladies wear · Colombo 11</p>
            <Headline
              className="mt-5 text-[3.6rem] font-black uppercase leading-[0.86] tracking-[-0.04em] sm:text-8xl lg:text-[8.5rem]"
              accent={<span className="text-transparent [-webkit-text-stroke:2px_#ffd84d]">your shop</span>}
            />
            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              Order from 6 pieces a style. Our staff call to confirm delivery and payment.
            </p>
            <div className="mt-8">
              <Buttons primary="bg-[#ffd84d] text-[var(--ink)]" secondary="border-white text-white hover:bg-white/10" />
            </div>
            <div className="mt-8">
              <Markers slides={slides} active={active} onPick={setActive} tone="light" />
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-[78%] max-w-[440px] md:w-[70%]">
            {slides.map((slide, index) => {
              const place = order[index];
              const style =
                place === 0
                  ? "z-30 rotate-0 translate-x-0 opacity-100"
                  : place === 1
                    ? "z-20 rotate-[7deg] translate-x-[18%] opacity-100"
                    : place === slides.length - 1
                      ? "z-10 rotate-[-7deg] -translate-x-[18%] opacity-100"
                      : "z-0 rotate-0 opacity-0";
              return (
                <div
                  key={slide.slug}
                  aria-hidden
                  className={`absolute inset-0 overflow-hidden border-[6px] border-white shadow-[0_24px_60px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out ${style}`}
                >
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    preload={index === 0}
                    {...(index === 0 ? {} : { loading: "lazy" as const })}
                    sizes="(max-width: 768px) 78vw, 30vw"
                    className="object-cover object-top"
                  />
                </div>
              );
            })}
            <Badge className="absolute -right-4 -top-6 z-40 h-24 w-24 rotate-[12deg] bg-[#ffd84d] text-[var(--ink)] sm:h-28 sm:w-28" />
            {current ? (
              <StyleLink
                slide={current}
                className="absolute -bottom-5 left-1/2 z-40 inline-flex min-h-11 -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-white px-5 text-sm text-[var(--ink)]"
              />
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  // "color": a strong colour block with the photo in an arch.
  return (
    <section aria-labelledby="hero-title" className="overflow-hidden bg-[#d93a26] text-[#fff6ea]" {...pauseProps}>
      <Ticker className="bg-[var(--ink)] text-[#ffd84d]" />
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 pb-0 pt-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-14 lg:px-10">
        <div className="md:pb-16">
          <p className="label flex items-center gap-3 text-[#ffd84d]">
            <span aria-hidden className="h-px w-8 bg-current" />
            Wholesale ladies wear · Colombo 11
          </p>
          <Headline
            className="mt-5 text-[3.4rem] font-black leading-[0.9] tracking-[-0.04em] sm:text-7xl lg:text-[7.25rem]"
            accent={<span className="italic text-[#ffd84d]">your shop</span>}
          />
          <p className="mt-6 max-w-md text-base leading-7 text-[#fff6ea]/85 lg:text-lg">
            Order from 6 pieces a style. Our staff call to confirm delivery and payment.
          </p>
          <div className="mt-8">
            <Buttons primary="bg-[#ffd84d] text-[var(--ink)] hover:brightness-105" secondary="border-[#fff6ea] text-[#fff6ea] hover:bg-white/10" />
          </div>
          <div className="mt-6">
            <Markers slides={slides} active={active} onPick={setActive} tone="light" />
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] border-[6px] border-b-0 border-[#fff6ea] bg-[#b92e1c]">
            <PhotoStack slides={slides} active={active} sizes="(max-width: 768px) 92vw, 42vw" />
          </div>
          <Badge className="absolute -left-2 top-[18%] z-20 h-24 w-24 rotate-[-12deg] bg-[#ffd84d] text-[var(--ink)] sm:-left-8 sm:h-32 sm:w-32" />
          {current ? (
            <StyleLink
              slide={current}
              className="absolute bottom-5 left-1/2 z-20 inline-flex min-h-11 -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full bg-[var(--ink)] px-5 text-sm text-white"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
