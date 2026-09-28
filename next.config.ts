import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 85],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // The stylesheet is small; inlining it removes a render-blocking request.
    inlineCss: true,
  },
  devIndicators: false,
  async headers() {
    return [
      {
        // Captured concept media (public/work/<slug>/...) only changes when it
        // is re-captured. `:file+` needs at least one segment after the slug,
        // so the /work/<slug> pages themselves are left alone.
        source: "/work/:slug/:file+",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
