import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is REQUIRED for the Z.ai sandbox publish mechanism
  // (build.sh copies .next/standalone into the deployment package; start.sh
  // boots next-service-dist/server.js). Vercel ignores this setting safely.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Prisma's query-engine binary must be resolvable by the standalone server.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
