import { CONTACT_EMAIL, INSTAGRAM_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const ORG_ID = `${SITE_URL}/#organization`;

const SERVICES = [
  "Custom design",
  "Development and launch",
  "Fast turnaround",
  "Hosting and support",
];

/**
 * The studio as a local business in the Maldives, and the site itself.
 * Page-level data (FAQ, breadcrumbs, case studies) is added per page.
 */
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": ORG_ID,
      name: SITE_NAME,
      url: SITE_URL,
      email: CONTACT_EMAIL,
      description: SITE_DESCRIPTION,
      image: `${SITE_URL}/og.jpg`,
      logo: `${SITE_URL}/icon.png`,
      address: { "@type": "PostalAddress", addressLocality: "Malé", addressCountry: "MV" },
      areaServed: [{ "@type": "Country", name: "Maldives" }, "Worldwide"],
      priceRange: "MVR 3,500+",
      currenciesAccepted: "MVR",
      sameAs: [INSTAGRAM_URL],
      knowsAbout: ["Web design", "Web development", "Website hosting", "Website maintenance"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: SERVICES.map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name, provider: { "@id": ORG_ID } },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": ORG_ID },
      inLanguage: "en",
    },
  ],
};

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** Serialise JSON-LD for a <script> tag. */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
