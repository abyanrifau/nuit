"use client";

import { PinnedSection, Reveal, RevealWords } from "@/components/PinnedSection";
import { PrismRefraction } from "@/components/PrismRefraction";

export function Contact() {
  return (
    <PinnedSection id="contact" hold={1}>
      {(progress) => (
        <>
          {/* Light enters top right, refracts, and lands on the button below */}
          <PrismRefraction progress={progress} />
          {/* The copy sits above the light, so a band of colour never dims it. */}
          <div className="relative z-10">
            <RevealWords
              as="h2"
              progress={progress}
              text="Have a project in mind?"
              range={[0.35, 0.55]}
              className="font-grotesk text-4xl uppercase leading-tight md:text-5xl"
            />
            <Reveal progress={progress} range={[0.5, 0.68]}>
              <p className="mt-6 max-w-[36em] font-neue text-base leading-relaxed md:text-lg">
                Tell us about your business and what you are looking to build.
                We will get back to you to discuss the details and next steps.
              </p>
            </Reveal>
            <Reveal progress={progress} range={[0.62, 0.8]}>
              <a
                data-prism-target
                href="mailto:hello@nuit.works"
                className="btn-fill mt-10 inline-block px-8 py-4 font-grotesk text-base leading-none"
              >
                Contact us
              </a>
            </Reveal>
          </div>
        </>
      )}
    </PinnedSection>
  );
}
