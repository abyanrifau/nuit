"use client";

import { useSyncExternalStore } from "react";
import Prism, { useIsLightTheme } from "@/components/Prism";
import { useScrollTo } from "@/components/SmoothScroll";

/** True at the desktop breakpoint, where the prism sits to the right of the wordmark. */
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(min-width: 768px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );
}

export function Hero() {
  const scrollTo = useScrollTo();
  const light = useIsLightTheme();
  const desktop = useIsDesktop();

  return (
    <section className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden pt-16">
      {/* Prism (adapted from React Bits) behind the wordmark, pushed right on desktop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          // Fade the canvas out toward the bottom so the prism's glow dissolves
          // into the page instead of being cut off at the section edge.
          maskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 62%, transparent 100%)",
        }}
      >
        <Prism
          animationType="hover"
          timeScale={0.5}
          height={3.5}
          baseWidth={4.3}
          scale={desktop ? 3.6 : 2.4}
          offset={{ x: desktop ? 300 : 0, y: -40 }}
          hueShift={-0.0416}
          colorFrequency={1.75}
          noise={0}
          glow={light ? 0.7 : 1}
          suspendWhenOffscreen
          lightMode={light}
        />
      </div>

      <div className="gutter">
        <h1
          id="hero-wordmark"
          // Pull the wordmark left by the N's side bearing so its ink lines up with the text below.
          className="-ml-[0.065em] font-grotesk text-[clamp(4rem,14vw,14rem)] leading-[0.9] tracking-[-0.04em]"
        >
          Nuit Works.
        </h1>
        <p className="mt-4 max-w-[28em] font-neue text-[clamp(1.5rem,2vw,2rem)] leading-snug md:mt-6">
          Web design and development, made in the Maldives.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-12">
          <a
            href="mailto:hello@nuit.works"
            className="no-dim inline-block border border-black bg-white px-8 py-4 font-grotesk text-base leading-none text-black transition-colors duration-200 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white focus-visible:outline-none"
          >
            Start a project
          </a>
          <a
            href="#concepts"
            onClick={(e) => {
              e.preventDefault();
              scrollTo("#concepts");
            }}
            className="font-neue text-base leading-none underline underline-offset-4"
          >
            View our work
          </a>
        </div>
      </div>
    </section>
  );
}
