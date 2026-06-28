import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone output for Vercel (Vercel handles this automatically)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
