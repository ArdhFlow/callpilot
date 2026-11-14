import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["treat-handbag-machinist.ngrok-free.dev"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
