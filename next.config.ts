import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // NOTE:
  // Turbopack font loading can fail with next/font/google in some Next versions.
  // If you previously enabled/ran Turbopack, use next build/dev with webpack.
  experimental: {
    turbopackFileSystemCacheForDev: false, // Prevents compilation caching lockups
  },
};

export default nextConfig;

