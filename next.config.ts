import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Admin tool — local only, no image optimization needed
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
