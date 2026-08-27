import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
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
