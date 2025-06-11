import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cos.ap-nanjing.myqcloud.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
