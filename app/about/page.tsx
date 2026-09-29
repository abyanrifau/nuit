import type { Metadata } from "next";
import { TeamSection } from "@/components/about/TeamSection";
import { FinalCta } from "@/components/home/FinalCta";
import { ProcessSteps } from "@/components/home/ProcessSteps";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { process } from "@/data/studio";
import { ogImage, pageMeta } from "@/lib/metadata";
import { HERO_WORDS } from "@/lib/site";
import { breadcrumbJsonLd, jsonLd } from "@/lib/structured-data";
import { pad2 } from "@/lib/utils";

export const metadata: Metadata = pageMeta({
  title: "About",
  description:
    "Nuit Works is a web design and development studio in the Maldives. We design, build, host and look after websites for clients here and abroad.",
  path: "/about",
  image: ogImage("about", "A web studio in the Maldives: about Nuit Works"),
});

const PRINCIPLES = [
  {
    title: "Direct",
    body: "You talk to the people doing the work. No account managers and no hand-offs.",
  },
  {
    title: "Custom",
    body: "Every site is designed from scratch for your business and your customers. We don't use templates.",
  },
  {
    title: "Looked after",
    body: "After launch we host, maintain and update your site, so you never have to deal with the tech.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }]))}
      />
      <PageHero
        eyebrow="About"
        lines={["A web studio", "in the Maldives."]}
        intro={
          <p>
            Nuit Works is a web design and development studio based in the Maldives. We take care of
            everything, from the first concept to launch and the ongoing support that follows.
          </p>
        }
      />

      <section data-light="intro" aria-labelledby="who-title" className="px-site section-y">
        <SectionLabel index={1}>Who we are</SectionLabel>
        <RevealText id="who-title" className="mt-8 max-w-[18ch] text-h2">
          One studio, start to finish. We design and build every site ourselves.
        </RevealText>

        <Reveal as="ul" className="mt-[clamp(56px,10vh,120px)] grid gap-10 md:grid-cols-3 md:gap-(--gutter)">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title} data-reveal-item className="border-t border-line pt-6">
              <p className="label tabular-nums text-muted">{pad2(i + 1)}</p>
              <h3 className="mt-4 text-h3">{p.title}</h3>
              <p className="mt-4 max-w-[26em] text-muted">{p.body}</p>
            </li>
          ))}
        </Reveal>

        <Reveal className="mt-[clamp(56px,10vh,120px)] grid-site gap-y-6 border-t border-line pt-8">
          <p className="label col-span-12 text-muted md:col-span-3">Where we work</p>
          <p className="col-span-12 max-w-[30em] text-lead md:col-span-8 md:col-start-5">
            We&rsquo;re based in the Maldives and work with businesses across the islands. We also
            take on international projects, with clients anywhere in the world.
          </p>
        </Reveal>
      </section>

      <section data-light="why" aria-labelledby="for-title" className="px-site section-y">
        <SectionLabel index={2}>Who we work with</SectionLabel>
        <h2 id="for-title" className="sr-only">
          Who we work with
        </h2>
        <Reveal className="mt-10">
          <p className="font-display text-[clamp(2rem,1.2rem+3.4vw,5rem)] leading-[1.08] tracking-[-0.035em]">
            {/* Each slash stays on the line of the word before it; the line
                can wrap in the space after. */}
            {HERO_WORDS.map((w) => (
              <span key={w}>
                <span className="capitalize">{w}</span>
                {" "}
                <span className="text-faint">/</span>{" "}
              </span>
            ))}
            <span className="text-faint">and More...</span>
          </p>
          <p className="mt-10 max-w-[32em] text-muted">
            Businesses of every kind: if you have customers to reach, we can help you reach them
            online.
          </p>
        </Reveal>
      </section>

      <TeamSection index={3} />
      <ProcessSteps steps={process} index={3} id="about-process" title="How we work together." />
      <FinalCta />
    </>
  );
}
