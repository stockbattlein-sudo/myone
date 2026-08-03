import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Produce a standalone server bundle for Docker production images
  output: 'standalone',

  // Transpile the workspace shared package
  transpilePackages: ['@stockbattle/shared'],

  // Proxy /api requests to the NestJS backend in development
  // In production, a reverse proxy (nginx/Caddy) handles this instead
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
