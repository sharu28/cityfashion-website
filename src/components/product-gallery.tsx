"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useProductPageState } from "@/components/product-page-state";
import { ProductPhotoStrip } from "@/components/product-photo-strip";
import { photoCaption } from "@/lib/product-colors";

type ProductGalleryProps = {
  images: string[];
  colors: string[];
  title: string;
};

/** Product page photos: big photo with arrows, a caption, and a row of small photos to jump to any of them. */
export function ProductGallery({ images: rawImages, colors, title }: ProductGalleryProps) {
  const images = useMemo(() => Array.from(new Set(rawImages)), [rawImages]);
  const pageState = useProductPageState();
  const [active, setActive] = useState(0);
  const [request, setRequest] = useState<{ index: number; at: number } | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const onActiveChange = useCallback((index: number) => setActive(index), []);

  // A colour tapped in the picker shows its photo here.
  const photoRequest = pageState?.photoRequest;
  useEffect(() => {
    if (!photoRequest) return;
    const index = images.indexOf(photoRequest.image);
    if (index >= 0) queueMicrotask(() => setRequest({ index, at: photoRequest.at }));
  }, [photoRequest, images]);

  // Keep the small photo of the one on show in view.
  useEffect(() => {
    const thumbs = thumbsRef.current;
    const thumb = thumbs?.children[active] as HTMLElement | undefined;
    if (!thumbs || !thumb) return;
    const left = thumb.offsetLeft - thumbs.clientWidth / 2 + thumb.clientWidth / 2;
    thumbs.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  const caption = images[active] ? photoCaption(images[active], colors) : "";

  return (
    <div>
      <ProductPhotoStrip
        images={images}
        title={title}
        imageSizes="(max-width: 1024px) 100vw, 50vw"
        eagerFirst
        showMarkers={false}
        autoplay={false}
        persistentArrows
        requestedIndex={request}
        onActiveChange={onActiveChange}
      >
        {images.length > 1 ? (
          <p className="pointer-events-none absolute bottom-2 left-2 bg-white/90 px-2 py-1 text-[0.6875rem] tabular-nums" aria-live="polite">
            {active + 1} / {images.length}
            {caption ? <span className="ml-1.5 text-[var(--text-soft)]">{caption}</span> : null}
          </p>
        ) : null}
      </ProductPhotoStrip>

      {images.length > 1 ? (
        <div
          ref={thumbsRef}
          className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:px-6 lg:px-0"
          aria-label="All photos"
        >
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setRequest({ index, at: Date.now() })}
              aria-label={`Show photo ${index + 1}${photoCaption(image, colors) ? `: ${photoCaption(image, colors)}` : ""}`}
              aria-current={index === active ? "true" : undefined}
              className={`relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-[var(--fill)] outline-offset-0 sm:w-14 ${
                index === active ? "outline-2 outline-[var(--ink)] outline" : "opacity-75 hover:opacity-100"
              }`}
            >
              <Image src={image} alt="" fill sizes="56px" className="object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
