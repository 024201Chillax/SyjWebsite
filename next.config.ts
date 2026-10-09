import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  images: {formats: ['image/avif', 'image/webp']},
  experimental: {optimizePackageImports: ['next-intl']}
};

export default nextConfig;
