import type { NextConfig } from 'next';

const nextConfig = {
  experimental: {
    serverExternalPackages: ['mammoth'],
  },
};

export default nextConfig;