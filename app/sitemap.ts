import type { MetadataRoute } from "next";

const SITE_URL = "https://www.nuit.works";

// The site is a single page; section anchors are not separate URLs.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
