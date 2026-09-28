import type { MetadataRoute } from "next";
import { work } from "@/data/work";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = [
    { path: "/", priority: 1 },
    { path: "/work", priority: 0.9 },
    { path: "/services", priority: 0.8 },
    { path: "/pricing", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.8 },
  ];
  return [
    ...pages.map((p) => ({
      url: `${SITE_URL}${p.path === "/" ? "/" : p.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.priority,
    })),
    ...work.map((w) => ({
      url: `${SITE_URL}/work/${w.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
      images: [`${SITE_URL}/work/${w.slug}/desktop-poster.webp`],
    })),
  ];
}
