"use client";

import { PinnedSection, Reveal, RevealWords } from "@/components/PinnedSection";
import Aurora from "@/components/Aurora";

const STATEMENT =
  "Nuit Works is a two-person studio based in the Maldives. We design and build websites for businesses that want to stand out online and be remembered. We take care of everything, from the first concept to launch and the ongoing support that follows.";

const EDGE_MASK = "linear-gradient(to bottom, transparent 0%, black 16%, black 84%, transparent 100%)";

export function Studio() {
  return (
    <PinnedSection
      id="studio"
      hold={1}
      background={
        <div
          className="h-full w-full"
          style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
        >
          <Aurora
            colorStops={["#5b8cff", "#ff6b9a", "#ffd166", "#5ce1a0", "#7ad9ff", "#c084fc"]}
            amplitude={1.2}
            blend={0.7}
            speed={0.5}
          />
        </div>
      }
    >
      {(progress) => (
        <>
          <Reveal progress={progress} range={[0.35, 0.5]}>
            <h2 className="font-grotesk text-4xl uppercase leading-tight md:text-5xl">
              Who we are
            </h2>
          </Reveal>
          <RevealWords
            progress={progress}
            text={STATEMENT}
            range={[0.42, 0.8]}
            className="mt-8 max-w-[24em] font-neue text-[clamp(1.5rem,2.8vw,2.5rem)] leading-[1.3]"
          />
        </>
      )}
    </PinnedSection>
  );
}
