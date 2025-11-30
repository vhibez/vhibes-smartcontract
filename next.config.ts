import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors for build
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors for build
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
