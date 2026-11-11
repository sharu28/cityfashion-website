// next/image loader for Cloudflare Workers.
// Cloudinary already resizes, so we ask it for the width the browser needs.
// Local /products/*.webp files are pre-sized by the importer and served as-is.

const uploadSegment = "/image/upload/";

export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
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
