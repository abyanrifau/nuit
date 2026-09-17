import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Preloader } from "@/components/Preloader";
import { faqs } from "@/data/faq";
import { ScrollProgress } from "@/components/ScrollProgress";
import GradualBlur from "@/components/GradualBlur";

const grotesk = localFont({
  src: "./fonts/AlteHaasGroteskBold.ttf",
  variable: "--font-grotesk",
  weight: "700",
  style: "normal",
  display: "swap",
});

const neue = localFont({
  src: "./fonts/HelveticaNeueLight.otf",
  variable: "--font-neue",
  weight: "300",
  style: "normal",
  display: "swap",
});

const SITE_URL = "https://www.nuit.works";
const TITLE = "Nuit Works | Web Design Studio in the Maldives";
const description =
  "Nuit Works is a web design and development studio in the Maldives. We design, build, host and maintain websites that help small businesses generate leads.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description,
  applicationName: "Nuit Works",
  authors: [{ name: "Nuit Works", url: SITE_URL }],
  creator: "Nuit Works",
  keywords: [
    "web design Maldives",
    "website design Maldives",
    "web development Maldives",
    "website hosting Maldives",
    "website maintenance",
    "small business website",
    "generate leads",
    "Nuit Works",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: TITLE,
    description,
    url: SITE_URL,
    siteName: "Nuit Works",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 2400,
        height: 1260,
        alt: "Nuit Works wordmark over a glowing prism, web design studio in the Maldives",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

/* Structured data: the studio as a local professional service, plus the site itself. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#organization`,
      name: "Nuit Works",
      url: SITE_URL,
      email: "hello@nuit.works",
      description,
      image: `${SITE_URL}/og.jpg`,
      logo: `${SITE_URL}/og.jpg`,
      address: { "@type": "PostalAddress", addressCountry: "MV" },
      areaServed: [{ "@type": "Country", name: "Maldives" }, "Worldwide"],
      priceRange: "Quote based",
      numberOfEmployees: { "@type": "QuantitativeValue", value: 2 },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
      sameAs: ["https://instagram.com/nuit.works"],
      knowsAbout: ["Web design", "Web development", "Website hosting", "Website maintenance"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: [
          "Custom design",
          "Development and launch",
          "Fast turnaround",
          "Hosting and support",
          "Unlimited revisions",
        ].map((name) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name, provider: { "@id": `${SITE_URL}/#organization` } },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Nuit Works",
      description,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: TITLE,
      description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      primaryImageOfPage: `${SITE_URL}/og.jpg`,
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${neue.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-white text-black">
        <SmoothScroll>
          <Preloader />
          <ScrollProgress />
          <Nav />
          <main>{children}</main>
          <Footer />
          {/* Content dissolves into a blur along the bottom edge of the viewport;
              z-index keeps it beneath the nav, mobile menu and preview popup */}
          <GradualBlur
            target="page"
            position="bottom"
            height="6rem"
            strength={2}
            divCount={5}
            curve="bezier"
            exponential
            opacity={1}
            zIndex={-70}
          />
        </SmoothScroll>
        {/* Vercel Web Analytics: cookieless page view tracking */}
        <Analytics />
      </body>
    </html>
  );
}
