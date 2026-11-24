// next/image loader for Cloudflare Workers.
// Cloudinary already resizes, so we ask it for the width the browser needs.
// Local /products/*.webp files have smaller copies made at build time by
// scripts/make-image-variants.mjs under /_img/w<width>/products/...

const uploadSegment = "/image/upload/";

// Must match variantWidths in scripts/make-image-variants.mjs.
export const variantWidths = [320, 480, 640, 828, 1200];

export function localVariant(src: string, width: number) {
  if (!src.startsWith("/products/") || !src.toLowerCase().endsWith(".webp")) return src;
  // `next dev` does not run the variant script, so use the original there.
  if (process.env.NODE_ENV === "development") return src;
  const variant = variantWidths.find((candidate) => candidate >= width) ?? variantWidths[variantWidths.length - 1];
  return `/_img/w${variant}${src}`;
}

export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (src.startsWith("/")) return localVariant(src, width);
  if (!src.startsWith("https://res.cloudinary.com/")) return src;

  const uploadIndex = src.indexOf(uploadSegment);
  if (uploadIndex === -1) return src;

  const head = src.slice(0, uploadIndex + uploadSegment.length);
  const rest = src.slice(uploadIndex + uploadSegment.length);
  const firstSlash = rest.indexOf("/");
  const firstSegment = firstSlash === -1 ? "" : rest.slice(0, firstSlash);
  const isTransform = firstSegment !== "" && !/^v\d+$/.test(firstSegment) && /(^|,)[a-z]{1,3}_/.test(firstSegment);

  if (!isTransform) {
    return `${head}c_limit,f_auto,q_auto,w_${width}/${rest}`;
  }

  const parts = firstSegment.split(",").filter((part) => !part.startsWith("w_"));
  parts.push(`w_${width}`);
  return `${head}${parts.join(",")}${rest.slice(firstSlash)}`;
}
