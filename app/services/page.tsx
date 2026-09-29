import type { Metadata } from "next";
import { FinalCta } from "@/components/home/FinalCta";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { Why } from "@/components/home/Why";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { process, services } from "@/data/studio";
import { ogImage, pageMeta } from "@/lib/metadata";
import { breadcrumbJsonLd, jsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";
import { pad2 } from "@/lib/utils";

export const metadata: Metadata = pageMeta({
  title: "Services",
  description:
    "Custom website design, development and launch, fast turnaround, and hosting and support. Web design and development in the Maldives by Nuit Works.",
  path: "/services",
  image: ogImage("services", "Everything you need to be online: services by Nuit Works"),
});

const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, "-");

export default function ServicesPage() {
  const serviceLd = {
    "@context": "https://schema.org",
    "@graph": services.map((s) => ({
      "@type": "Service",
      name: s.name,
      description: s.body,
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: ["Maldives", "Worldwide"],
      url: `${SITE_URL}/services#${slug(s.name)}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(serviceLd)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Services", path: "/services" }]))}
      />
      <PageHero
        eyebrow="Services"
        lines={["Everything you", "need to be online."]}
        intro={
          <p>
            We design, build, launch and look after websites for businesses. One studio, from
            the first idea to the day-to-day updates, so you always know who to talk to.
          </p>
        }
      />

      <section data-light="services" aria-label="What we do" className="px-site pb-(--section-y)">
        <ol className="border-t border-line">
          {services.map((s, i) => (
            <li key={s.name} id={slug(s.name)} className="grid-site scroll-mt-32 gap-y-8 border-b border-line py-[clamp(48px,9vh,112px)]">
              <p className="label col-span-12 tabular-nums text-muted md:col-span-1">{pad2(i + 1)}</p>
              <RevealText as="h2" className="col-span-12 max-w-[12ch] text-h2 md:col-span-5">
                {s.name}
              </RevealText>
              <Reveal className="col-span-12 md:col-span-5 md:col-start-8">
                <p className="text-lead">{s.body}</p>
                <p className="label mt-10 text-muted">What you get</p>
                <ul className="mt-4 border-t border-line">
                  {s.youGet.map((g) => (
                    <li key={g} className="flex gap-4 border-b border-line py-3.5">
                      <span aria-hidden="true" className="mt-[0.7em] size-1 shrink-0 rounded-full bg-fg" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <Why index={1} />
      <ProcessSteps steps={process} index={2} id="services-process" />
      <FinalCta />
    </>
  );
}
