import type { NextConfig } from 'next';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ??
  'http://localhost:3001/api';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
