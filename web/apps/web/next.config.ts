import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Silence monorepo workspace root warning
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Static export for Electron desktop build (set NEXT_EXPORT=1)
  ...(process.env.NEXT_EXPORT === '1' ? { output: 'export', images: { unoptimized: true } } : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
    ],
  },
  // Suppress Firebase SSR warnings — the app uses client-side Firebase only
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,
    };
    return config;
  },
};

export default nextConfig;
