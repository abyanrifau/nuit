import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Preloader } from "@/components/Preloader";
import { ScrollProgress } from "@/components/ScrollProgress";

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

export const metadata: Metadata = {
  title: "Nuit Works",
  description:
    "Nuit Works is a two-person web design and development studio based in the Maldives.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${neue.variable}`}
      // Dark by default; the inline script below applies a saved choice before hydration.
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("nuit-works-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}',
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-black">
        <SmoothScroll>
          <Preloader />
          <ScrollProgress />
          <Nav />
          <main>{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}
