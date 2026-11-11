"use client";

import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, type ReactNode, useRef, useState } from "react";

const maxMarkers = 8;

type ProductPhotoStripProps = {
  images: string[];
  title: string;
  imageSizes: string;
  href?: string;
  aspect?: "3/4" | "4/5";
  showMarkers?: boolean;
  /** Preload the first photo. Use only for the main photo of a page. */
  eagerFirst?: boolean;
  /** Overlays drawn on top of the photo (badge, add button). */
  children?: ReactNode;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Swipe sideways on a phone, move the mouse across on a computer.
 * Uses native scroll-snap so vertical page scrolling that starts on a photo keeps working.
 */
export function ProductPhotoStrip({
  images: rawImages,
  title,
  imageSizes,
  href,
  aspect = "3/4",
  showMarkers = true,
  eagerFirst = false,
  children,
}: ProductPhotoStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  // Some styles list the same photo twice; show it once.
  const images = Array.from(new Set(rawImages));
  const count = images.length;
  const aspectClass = aspect === "4/5" ? "aspect-[4/5]" : "aspect-[3/4]";

  function goTo(index: number) {
    const strip = stripRef.current;
    if (!strip) return;
    const target = Math.max(0, Math.min(count - 1, index));
    strip.scrollTo({ left: target * strip.clientWidth, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    setActive(target);
  }

  function onScroll() {
    const strip = stripRef.current;
    if (!strip || strip.clientWidth === 0) return;
    setActive(Math.max(0, Math.min(count - 1, Math.round(strip.scrollLeft / strip.clientWidth))));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const strip = stripRef.current;
    if (event.pointerType !== "mouse" || !strip || count < 2) return;
    const rect = strip.getBoundingClientRect();
    if (rect.width === 0) return;
    const index = Math.max(0, Math.min(count - 1, Math.floor(((event.clientX - rect.left) / rect.width) * count)));
    if (index === active) return;
    strip.scrollLeft = index * strip.clientWidth;
    setActive(index);
  }

  if (count === 0) {
    return (
      <div className={`relative ${aspectClass} flex items-center justify-center bg-[var(--fill)] text-xs text-[var(--text-soft)]`}>
        No photo yet
        {children}
      </div>
    );
  }

  return (
    <div className="group/strip">
      <div className={`relative ${aspectClass} overflow-hidden bg-[var(--fill)]`}>
        <div
          ref={stripRef}
          data-photo-strip
          onScroll={onScroll}
          onPointerMove={onPointerMove}
          style={{ touchAction: "pan-x pan-y" }}
          className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
        >
          {images.map((image, index) => {
            const label = `${title}, photo ${index + 1} of ${count}`;
            const photo = (
              <Image
                src={image}
                alt={label}
                fill
                sizes={imageSizes}
                className="object-cover"
                draggable={false}
                {...(eagerFirst && index === 0 ? { preload: true } : { loading: "lazy" as const })}
              />
            );
            return (
              <div key={image} className="relative h-full w-full shrink-0 snap-start">
                {href ? (
                  <Link href={href} tabIndex={index === 0 ? undefined : -1} className="block h-full w-full" aria-label={label}>
                    {photo}
                  </Link>
                ) : (
                  photo
                )}
              </div>
            );
          })}
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              className="absolute left-0 top-1/2 hidden h-11 w-9 -translate-y-1/2 items-center justify-center bg-white/90 opacity-0 transition-opacity focus-visible:opacity-100 disabled:hidden group-hover/strip:opacity-100 md:flex"
            >
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => goTo(active + 1)}
              disabled={active === count - 1}
              className="absolute right-0 top-1/2 hidden h-11 w-9 -translate-y-1/2 items-center justify-center bg-white/90 opacity-0 transition-opacity focus-visible:opacity-100 disabled:hidden group-hover/strip:opacity-100 md:flex"
            >
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        ) : null}

        {children}
      </div>

      {showMarkers && count > 1 ? (
        count > maxMarkers ? (
          <p className="px-2.5 pt-2 text-[0.6875rem] tabular-nums text-[var(--text-soft)]" aria-live="polite">
            {active + 1} / {count}
          </p>
        ) : (
          <div className="flex gap-1 px-2.5 pt-2">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`Photo ${index + 1} of ${count}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
                // 24px tap area around a small square marker.
                className="group/marker -my-2 flex h-6 w-3.5 items-center justify-center"
              >
                <span
                  className={`block h-1.5 w-2.5 transition-colors ${
                    index === active ? "bg-[var(--ink)]" : "bg-[var(--line)] group-hover/marker:bg-[var(--text-soft)]"
                  }`}
                />
              </button>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
