import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseDesignSystem } from "@/components/case/CaseDesignSystem";
import { CaseHero } from "@/components/case/CaseHero";
import { CaseRecordings } from "@/components/case/CaseRecordings";
import { CaseStory } from "@/components/case/CaseStory";
import { NextProject } from "@/components/case/NextProject";
import { PageStrip } from "@/components/case/PageStrip";
import { getWork, media, nextWork, work } from "@/data/work";
import { ogImage, pageMeta } from "@/lib/metadata";
import { breadcrumbJsonLd, jsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return work.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) return {};
  return pageMeta({
    title: `${w.name}, ${w.industry.toLowerCase()} ${w.kind.toLowerCase()}`,
    description: `${w.summary} A ${w.kind.toLowerCase()} website by Nuit Works, designed and built in the Maldives.`,
    path: `/work/${w.slug}`,
    image: ogImage(`work-${w.slug}`, `${w.name}, a ${w.industry.toLowerCase()} ${w.kind.toLowerCase()} website by Nuit Works`),
  });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) notFound();
  const next = nextWork(w.slug);

  const creativeWork = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: w.name,
    headline: `${w.name}: ${w.summary}`,
    description:
      w.kind === "Concept"
        ? `A concept website designed and built by Nuit Works to show what the studio can do; not a client project. ${w.brief}`
        : w.brief,
    url: `${SITE_URL}/work/${w.slug}`,
    genre: w.kind === "Concept" ? "Concept website" : "Website",
    about: w.industry,
    dateCreated: String(w.year),
    image: `${SITE_URL}${media(w.slug).desktop.poster}`,
    creator: { "@id": `${SITE_URL}/#organization` },
    sameAs: w.url,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(creativeWork)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Work", path: "/work" },
            { name: w.name, path: `/work/${w.slug}` },
          ]),
        )}
      />
      <CaseHero work={w} />
      <CaseRecordings work={w} />
      <CaseStory work={w} />
      <CaseDesignSystem work={w} />
      <PageStrip work={w} />
      <NextProject current={w} next={next} />
    </>
  );
}
