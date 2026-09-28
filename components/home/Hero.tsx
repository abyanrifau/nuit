import type { CSSProperties } from "react";
import { HeroLine } from "@/components/home/HeroLine";
import { HeroPrism } from "@/components/prism/HeroPrism";
import { Button } from "@/components/ui/Button";
import { ScrollLink } from "@/components/ui/ScrollLink";

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

/*
 * The one big moment. The prism glows behind; the wordmark is set across the
 * full width at the bottom of the screen, with the rolling line and the two
 * actions beneath it. The wordmark is painted on first load (the loading
 * screen, when it plays, fades away to reveal it), so it is never held back.
 *
 * With a mouse the prism is at its original, full size to the right, and its
 * glow runs on below the hero; the empty space left under the hero there
 * gives it room before the next section starts. On touch screens it fills
 * the hero behind the heading and fades out before its bottom edge instead
 * (see HeroPrism).
 */
export function Hero() {
  return (
    <section
      data-light="hero"
      aria-labelledby="hero-wordmark"
      className="relative isolate flex min-h-svh flex-col justify-end overflow-x-clip pb-[clamp(28px,5.5vh,64px)] pt-(--header-h) hero-gap"
    >
      <HeroPrism />

      <div className="px-site">
        <h1
          id="hero-wordmark"
          // Pulled left by the N's side bearing so its ink lines up with the text below.
          className="-ml-[0.06em] font-display text-[29.5vw] leading-[0.8] tracking-[-0.05em] md:text-display md:leading-[0.8]"
        >
          <span className="block md:inline-block">
            <span className="wm-word inline-block" style={d(0.05)}>
              Nuit
            </span>
          </span>{" "}
          <span className="block md:inline-block">
            <span className="wm-word inline-block" style={d(0.13)}>
              Works.
            </span>
          </span>
        </h1>

        <div className="mt-[clamp(22px,4.2vh,48px)] flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <HeroLine className="enter-fade" />
          <div className="enter-fade flex flex-wrap items-center gap-x-8 gap-y-4" style={d(0.12)}>
            <Button href="/contact">Start a project</Button>
            <ScrollLink href="#work">View our work</ScrollLink>
          </div>
        </div>
      </div>
    </section>
  );
}
