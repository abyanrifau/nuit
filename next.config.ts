import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  // Hide the floating Next.js dev-tools badge during development.
  devIndicators: false,
};

export default nextConfig;
