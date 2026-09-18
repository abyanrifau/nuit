import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // The stylesheet is small; inlining it removes the render-blocking request.
    inlineCss: true,
  },
  // Hide the floating Next.js dev-tools badge during development.
  devIndicators: false,
};

export default nextConfig;
