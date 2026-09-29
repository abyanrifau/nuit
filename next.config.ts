import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

/*
 * Content Security Policy: exactly what the site uses. Everything is served
 * from its own origin (fonts, images, video, the form's server action and
 * Vercel Analytics, which is proxied through /_vercel). Inline scripts are
 * needed for Next's bootstrap, the loading screen and JSON-LD; inline styles
 * for React's style attributes. `data:` images are the film grain texture.
 * Development also needs eval for fast refresh.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self'",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

// Every response.
const transportHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

// Only meaningful on documents, so they are not repeated on every script,
// font and image the page loads (about 0.8KB a response).
const pageHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()",
  },
  ...(dev ? [] : [{ key: "Content-Security-Policy", value: csp }]),
];

// Captured concept media and the hero's still frames only change when they
// are re-made, so browsers may keep them for a year. Give a replacement file
// a new name so visitors pick it up straight away.
const longCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

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
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: transportHeaders },
      { source: "/((?!_next/static|_next/image).*)", headers: pageHeaders },
      // `:file+` needs at least one segment after the slug, so the
      // /work/<slug> pages themselves are left alone.
      { source: "/work/:slug/:file+", headers: longCache },
      { source: "/hero-poster-:variant", headers: longCache },
    ];
  },
};

export default nextConfig;
