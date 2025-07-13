import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        port: '',
        pathname: '/b/id/**',
      },
      {
        protocol: 'https',
        hostname: 'external-content.duckduckgo.com',
        port: '',
        pathname: '/iu/**',
      },
      {
        protocol: 'https',
        hostname: 'duckduckgo.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/openlibrary/:path*',
        destination: 'https://openlibrary.org/:path*',
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
