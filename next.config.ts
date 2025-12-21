import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ensure images are optimized for Netlify
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
