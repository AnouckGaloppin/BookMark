import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
