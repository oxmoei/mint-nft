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
  // Webpack configuration to handle file paths with special characters
  webpack: (config, { isServer, webpack }) => {
    // Fix for file system paths with special characters
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ignore optional dependencies from @wagmi/connectors that we don't use
    config.resolve.alias = {
      ...config.resolve.alias,
      '@base-org/account': false,
      '@coinbase/wallet-sdk': false,
      '@gemini-wallet/core': false,
      'porto': false,
      '@safe-global/safe-apps-sdk': false,
      '@safe-global/safe-apps-provider': false,
      '@walletconnect/ethereum-provider': false,
    };
    
    // Use IgnorePlugin to ignore optional dependencies from @wagmi/connectors
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(@base-org\/account|@coinbase\/wallet-sdk|@gemini-wallet\/core|porto|@safe-global\/safe-apps-sdk|@safe-global\/safe-apps-provider|@walletconnect\/ethereum-provider)$/,
      })
    );
    
    return config;
  },
  // Development server configuration
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
};

export default nextConfig;
