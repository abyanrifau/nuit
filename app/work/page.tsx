import type { Metadata } from "next";
import { FinalCta } from "@/components/home/FinalCta";
import { PageHero } from "@/components/layout/PageHero";
import { WorkIndex } from "@/components/work/WorkIndex";
import { work } from "@/data/work";
import { ogImage, pageMeta } from "@/lib/metadata";
import { breadcrumbJsonLd, jsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Work",
  description:
    "Six concept websites by Nuit Works for cafes, guesthouses, shops and boutiques, designed and built in the Maldives to show what the studio can do.",
  path: "/work",
  image: ogImage("work", "Concepts, built to be used: concept websites by Nuit Works"),
});

export default function WorkPage() {
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: work.map((w, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/work/${w.slug}`,
      name: `${w.name} (${w.industry} ${w.kind.toLowerCase()})`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(list)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Work", path: "/work" }]))}
      />
      <PageHero
        eyebrow="Work"
        lines={["Concepts, built", "to be used."]}
        intro={
          <p>
            Sites we designed and built for the kinds of businesses we work with: cafes, a
            guesthouse, shops and boutiques. Each one is a concept we made to show what we can do,
            and each one is live, so you can try it yourself.
          </p>
        }
      />
      <section data-light="work" aria-label="All work" className="px-site pb-(--section-y)">
        <WorkIndex items={work} />
      </section>
      <FinalCta />
    </>
  );
}
