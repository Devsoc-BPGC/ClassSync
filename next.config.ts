import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile images
  },
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
};

export default nextConfig;
