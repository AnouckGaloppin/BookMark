import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
