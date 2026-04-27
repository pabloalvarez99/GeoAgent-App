import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export for Electron desktop build (set NEXT_EXPORT=1)
  // trailingSlash: true makes Next.js emit /route/index.html (folder per route)
  // instead of /route.html, which is required for the app:// protocol handler in Electron.
  ...(process.env.NEXT_EXPORT === '1' ? { output: 'export', trailingSlash: true, images: { unoptimized: true } } : {}),
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
