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
   experimental: {
    turbopackFileSystemCacheForDev: false, // Prevents compilation caching lockups
  },
};

export default nextConfig;
