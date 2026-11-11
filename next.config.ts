import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Workers has no built-in image optimizer; Cloudinary resizes instead.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [160, 240, 320],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.cityfashion.shop" }],
        destination: "https://cityfashion.shop/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "cityfashion.style" }],
        destination: "https://cityfashion.shop/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.cityfashion.style" }],
        destination: "https://cityfashion.shop/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "cityfashion-website.vercel.app" }],
        destination: "https://cityfashion.shop/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "cityfashion-website-sharukeshseker-gmailcoms-projects.vercel.app" }],
        destination: "https://cityfashion.shop/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "cityfashion-website-git-main-sharukeshseker-gmailcoms-projects.vercel.app" }],
        destination: "https://cityfashion.shop/:path*",
        permanent: true,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

// Gives `next dev` access to the D1 binding and Worker vars through getCloudflareContext().
initOpenNextCloudflareForDev();
