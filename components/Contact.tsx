"use client";

import { PinnedSection, Reveal, RevealWords } from "@/components/PinnedSection";

export function Contact() {
  return (
    <PinnedSection id="contact" hold={1}>
      {(progress) => (
        <>
          <RevealWords
            as="h2"
            progress={progress}
            text="Have a project in mind?"
            range={[0.35, 0.55]}
            className="font-grotesk text-4xl uppercase leading-tight md:text-5xl"
          />
          <Reveal progress={progress} range={[0.5, 0.68]}>
            <p className="mt-6 max-w-[36em] font-neue text-base leading-relaxed md:text-lg">
              Tell us about your business and what you are looking to build. We
              will get back to you to discuss the details and next steps.
            </p>
          </Reveal>
          <Reveal progress={progress} range={[0.62, 0.8]}>
            <a
              href="mailto:hello@nuit.works"
              className="no-dim mt-10 inline-block border border-black bg-white px-8 py-4 font-grotesk text-base leading-none text-black transition-colors duration-200 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white focus-visible:outline-none"
            >
              Contact us
            </a>
          </Reveal>
        </>
      )}
    </PinnedSection>
  );
}
