import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Cursor } from "@/components/cursor/Cursor";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/layout/Nav";
import { Loader, LOADER_HEAD_SCRIPT } from "@/components/layout/Loader";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { LightField } from "@/components/light/LightField";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { TransitionProvider } from "@/components/transition/TransitionProvider";
import { organizationJsonLd } from "@/lib/structured-data";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

// The same two faces as before, the same files: Alte Haas Grotesk Bold for
// the wordmark, headings, nav and buttons; Helvetica Neue Light for body.
const grotesk = localFont({
  src: "./fonts/AlteHaasGroteskBold.woff2",
  variable: "--font-grotesk",
  weight: "700",
  style: "normal",
  display: "swap",
  preload: true,
});

const neue = localFont({
  src: "./fonts/HelveticaNeueLight.woff2",
  variable: "--font-neue",
  weight: "300",
  style: "normal",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | Nuit Works" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${neue.variable}`}
      // The loader script sets data-loader before hydration.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOADER_HEAD_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body>
        <a
          href="#main"
          className="btn btn-sm fixed left-4 top-4 z-[95] -translate-y-24 focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        {/* First in the body, so the cover is there before any of the page paints. */}
        <Loader />
        <SmoothScroll>
          <TransitionProvider>
            <LightField />
            <ScrollProgress />
            <Nav />
            {/* The page: the part that fades out and in between pages. */}
            <div data-page className="relative z-[1]">
              <main id="main">{children}</main>
              <Footer />
            </div>
            <Cursor />
          </TransitionProvider>
        </SmoothScroll>
        <Analytics />
      </body>
    </html>
  );
}
