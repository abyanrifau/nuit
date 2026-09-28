import type { Metadata } from "next";
import { FinalCta } from "@/components/home/FinalCta";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { CompareTable } from "@/components/pricing/CompareTable";
import { FaqList } from "@/components/pricing/FaqList";
import { HostingPlans } from "@/components/pricing/HostingPlans";
import { PackagePicker } from "@/components/pricing/PackagePicker";
import { PricingCard } from "@/components/pricing/PricingCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { faqs } from "@/data/faq";
import { packages, planIncludes, plans, pricingNotes } from "@/data/pricing";
import { getWork } from "@/data/work";
import { pageMeta } from "@/lib/metadata";
import { breadcrumbJsonLd, faqJsonLd, jsonLd } from "@/lib/structured-data";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Pricing",
  description:
    "Website packages in the Maldives: Essential from MVR 3,500, Business from MVR 7,500 and Commerce from MVR 12,500. Hosting and support from MVR 300 a month.",
  path: "/pricing",
});

const amount = (price: string) => Number(price.replace(/[^\d]/g, ""));

export default function PricingPage() {
  const offers = {
    "@context": "https://schema.org",
    "@type": "OfferCatalog",
    name: "Websites, hosting and support",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Website packages",
        itemListElement: packages.map((p) => ({
          "@type": "Offer",
          name: p.name,
          description: `${p.goodFor} ${p.includes.join(", ")}.`,
          url: `${SITE_URL}/pricing#${p.id}`,
          priceSpecification: { "@type": "PriceSpecification", priceCurrency: "MVR", minPrice: amount(p.price) },
          seller: { "@id": `${SITE_URL}/#organization` },
        })),
      },
      {
        "@type": "OfferCatalog",
        name: "Hosting and support plans",
        itemListElement: plans.map((p) => ({
          "@type": "Offer",
          name: `${p.name} hosting and support`,
          description: [...planIncludes, ...(p.adds ?? [])].join(", ") + ".",
          url: `${SITE_URL}/pricing#${p.id}`,
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceCurrency: "MVR",
            price: amount(p.price),
            unitText: "MONTH",
          },
          seller: { "@id": `${SITE_URL}/#organization` },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(offers)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqJsonLd(faqs))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }]))}
      />
      <PageHero
        eyebrow="Pricing"
        lines={["Clear prices,", "quoted to fit."]}
        intro={
          <p>
            Three website packages with starting prices, and monthly plans to host and look after your
            site. Every project is quoted on its size, and you get a clear quote before any work starts.
          </p>
        }
      />

      <section data-light="pricing" aria-labelledby="packages-title" className="overflow-x-clip px-site pb-(--section-y)">
        <h2 id="packages-title" className="sr-only">
          Website packages
        </h2>
        <div className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-(--gutter)">
          {packages.map((p) => (
            <PricingCard key={p.id} pkg={p} example={getWork(p.example.slug)} />
          ))}
        </div>

        <div className="mt-[clamp(56px,10vh,120px)]">
          <CompareTable />
        </div>
      </section>

      <section id="find-your-package" data-light="pricing" aria-labelledby="picker-title" className="px-site section-y scroll-mt-24">
        <div className="grid-site gap-y-8">
          <div className="col-span-12 md:col-span-6">
            <SectionLabel>Not sure?</SectionLabel>
            <RevealText id="picker-title" className="mt-8 max-w-[12ch] text-h2">
              Find your package.
            </RevealText>
          </div>
          <Reveal className="col-span-12 md:col-span-5 md:col-start-8 md:self-end">
            <p className="text-lead text-muted">
              Two quick questions about your business, and we&rsquo;ll point you to the package that
              fits.
            </p>
          </Reveal>
        </div>
        <Reveal className="mt-[clamp(40px,7vh,80px)]">
          <PackagePicker />
        </Reveal>
      </section>

      <HostingPlans />

      <section data-light="services" aria-labelledby="notes-title" className="px-site pb-(--section-y)">
        <Reveal className="grid-site gap-y-6">
          <h2 id="notes-title" className="label col-span-12 text-muted md:col-span-3">
            Good to know
          </h2>
          <ul className="col-span-12 flex flex-col gap-4 md:col-span-8 md:col-start-5">
            {pricingNotes.map((n) => (
              <li key={n} className="flex gap-4">
                <span aria-hidden="true" className="mt-[0.7em] size-1 shrink-0 rounded-full bg-fg" />
                <span className="text-muted">{n}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section data-light="services" aria-labelledby="faq-title" className="px-site section-y">
        <SectionLabel>Questions</SectionLabel>
        <RevealText id="faq-title" className="mt-8 max-w-[14ch] text-h2">
          Common questions.
        </RevealText>
        <div className="mt-[clamp(40px,7vh,80px)]">
          <FaqList items={faqs} />
        </div>
      </section>

      <FinalCta />
    </>
  );
}
