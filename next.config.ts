import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable image optimization for Netlify deployment
  // Netlify's IPX service may fail, so we use unoptimized images
  images: {
    unoptimized: true,
  },
  // Add security headers for MetaMask compatibility
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
