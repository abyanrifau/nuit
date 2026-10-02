import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseDesignSystem } from "@/components/case/CaseDesignSystem";
import { CaseHero } from "@/components/case/CaseHero";
import { CaseProblem } from "@/components/case/CaseProblem";
import { CaseRecordings } from "@/components/case/CaseRecordings";
import { CaseStory } from "@/components/case/CaseStory";
import { NextProject } from "@/components/case/NextProject";
import { PageStrip } from "@/components/case/PageStrip";
import { getWork, media, nextWork, work, type Work } from "@/data/work";
import { ogImage, pageMeta } from "@/lib/metadata";
import { breadcrumbJsonLd, jsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return work.map((w) => ({ slug: w.slug }));
}

// Search results show about 160 characters, so the description is fitted to
// 140 to 160 whatever the length of the summary.
function describe(w: Work) {
  const kind = `${w.industry.toLowerCase()} ${w.kind.toLowerCase()}`;
  const full = `${w.summary} A ${kind} website designed and built by Nuit Works, a web design studio in the Maldives.`;
  if (full.length > 160) return `${w.summary} A ${kind} website by Nuit Works, a web design studio in the Maldives.`;
  if (full.length < 140 && w.kind === "Concept") return `${full} Not a client project.`;
  return full;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const w = getWork(slug);
  if (!w) return {};
  return pageMeta({
    title: `${w.name}, ${w.industry.toLowerCase()} ${w.kind.toLowerCase()}`,
    description: describe(w),
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
      <CaseProblem work={w} />
      <CaseRecordings work={w} />
      <CaseStory work={w} />
      <CaseDesignSystem work={w} />
      <PageStrip work={w} />
      <NextProject current={w} next={next} />
    </>
  );
}
