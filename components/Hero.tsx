"use client";

import { GMAIL_COMPOSE_URL } from "@/lib/contact";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";
import { useAfterIdle } from "@/components/LazyMount";
import { useScrollTo } from "@/components/SmoothScroll";

// The WebGL prism is loaded and started only after the page has painted and
// gone idle; until then a poster of its first frame holds its place.
const Prism = dynamic(() => import("@/components/Prism"), { ssr: false });

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
  const desktop = useIsDesktop();
  const reduced = useReducedMotion();
  const idle = useAfterIdle();
  const mountPrism = idle && !reduced;
  // Cross-fade from the poster once the canvas has had a moment to draw.
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!mountPrism) return;
    const t = window.setTimeout(() => setLive(true), 450);
    return () => window.clearTimeout(t);
  }, [mountPrism]);

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
          WebkitMaskImage:
            "linear-gradient(to bottom, black 62%, transparent 100%)",
        }}
      >
        {/* Static first frame, scaled to the hero's height like the canvas is */}
        <div
          className="hero-poster absolute inset-0 transition-opacity duration-700 ease-out"
          style={{ opacity: live ? 0 : 1 }}
        />
        {mountPrism && (
          <div
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{ opacity: live ? 1 : 0 }}
          >
            <Prism
              // Desktop tilts with the mouse; on mobile it drifts slowly on its own.
              animationType={desktop ? "hover" : "3drotate"}
              timeScale={desktop ? 0.5 : 0.22}
              height={3.5}
              baseWidth={4.3}
              scale={desktop ? 3.6 : 2.4}
              offset={{ x: desktop ? 300 : 0, y: -40 }}
              hueShift={-0.0416}
              colorFrequency={1.75}
              noise={0}
              glow={1}
              suspendWhenOffscreen
              // Fewer pixels on phones; the glow is soft enough to look the same.
              renderScale={desktop ? 0.5 : 0.4}
            />
          </div>
        )}
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
            href={GMAIL_COMPOSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-fill inline-block px-8 py-4 font-grotesk text-base leading-none"
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
