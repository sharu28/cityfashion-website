"use client";

import Image from "next/image";
import Link from "next/link";
import { type PointerEvent, useEffect, useState } from "react";

type ProductImageCarouselProps = {
  href?: string;
  imageSizes: string;
  images: string[];
  title: string;
};

const carouselIntervalMs = 900;

export function ProductImageCarousel({
  href,
  imageSizes,
  images,
  title,
}: ProductImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    if (!isHovering || !hasMultipleImages) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, carouselIntervalMs);

    return () => window.clearInterval(interval);
  }, [hasMultipleImages, images.length, isHovering]);

  const startCarousel = (pointerType: string) => {
    if (
      pointerType !== "mouse" ||
      !hasMultipleImages ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    setActiveIndex(1);
    setIsHovering(true);
  };

  const resetCarousel = () => {
    setIsHovering(false);
    setActiveIndex(0);
  };

  const coverImage = images[0];
  const activeImage = images[activeIndex];
  const nextImage = isHovering ? images[(activeIndex + 1) % images.length] : undefined;
  const frameProps = {
    className: "relative block aspect-[4/5] overflow-hidden border border-[var(--line)] bg-white",
    onPointerEnter: (event: PointerEvent<HTMLElement>) => startCarousel(event.pointerType),
    onPointerLeave: resetCarousel,
  };
  const frameContent = (
    <>
      {activeImage ? (
        <>
          {/* Cover stays underneath so a still-loading hover photo never shows a blank frame. */}
          {activeIndex > 0 ? (
            <Image src={coverImage} alt="" aria-hidden fill className="object-cover" sizes={imageSizes} />
          ) : null}
          <Image
            key={activeImage}
            src={activeImage}
            alt={`${title}, photo ${activeIndex + 1} of ${images.length}`}
            fill
            className="animate-[product-tile-image-enter_420ms_cubic-bezier(0.16,1,0.3,1)] object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] motion-reduce:animate-none motion-reduce:transition-none"
            sizes={imageSizes}
          />
          {nextImage && nextImage !== activeImage ? (
            <Image
              src={nextImage}
              alt=""
              aria-hidden
              fill
              loading="eager"
              className="pointer-events-none object-cover opacity-0"
              sizes={imageSizes}
            />
          ) : null}
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-sm font-black uppercase tracking-[0.18em] text-[var(--text-soft)]">
          No Image
        </div>
      )}

      {hasMultipleImages ? (
        <span className="pointer-events-none absolute bottom-2 right-2 bg-[rgba(18,17,15,0.84)] px-2 py-1 font-mono text-[0.62rem] font-black uppercase tracking-[0.1em] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 motion-reduce:hidden">
          {activeIndex + 1} / {images.length}
        </span>
      ) : null}
    </>
  );

  return href ? (
    <Link href={href} {...frameProps}>
      {frameContent}
    </Link>
  ) : (
    <div {...frameProps}>{frameContent}</div>
  );
}
