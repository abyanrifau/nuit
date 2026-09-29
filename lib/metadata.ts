import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const DEFAULT_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "Nuit Works wordmark over a glowing prism, web design studio in the Maldives",
};

/** A page's own share image (made by scripts/og-images.mjs). */
export const ogImage = (name: string, alt: string) => ({ url: `/og/${name}.jpg`, width: 1200, height: 630, alt });

/**
 * Complete metadata for an inner page. Next replaces (rather than merges)
 * nested objects like openGraph, so each page sets the full set here.
 */
export function pageMeta({
  title,
  description,
  path,
  image,
}: {
  title: string;
  description: string;
  path: string;
  image?: { url: string; width: number; height: number; alt: string };
}): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const img = image ?? DEFAULT_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [img],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [img.url],
    },
  };
}
