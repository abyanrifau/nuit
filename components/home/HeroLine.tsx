"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { EASE_SWAP, prefersReducedMotion } from "@/lib/motion";
import { HERO_SENTENCE, HERO_WORDS } from "@/lib/site";
import { cn } from "@/lib/utils";

const HOLD_MS = 2100;

/**
 * "Websites for [cafes], made in the Maldives." The business rolls: the word
 * slides up and out of a mask with a slight blur while the next rises in,
 * and the slot eases to the new word's width so the rest of the line glides
 * rather than jumps. Screen readers get the whole list as one sentence.
 */
export function HeroLine({ className }: { className?: string }) {
  const slotRef = useRef<HTMLSpanElement>(null);
  const aRef = useRef<HTMLSpanElement>(null);
  const bRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const slot = slotRef.current!;
    const measure = measureRef.current!;
    let front = aRef.current!;
    let back = bRef.current!;
    const reduced = prefersReducedMotion();
    let index = 0;
    let timer = 0;
    let inView = true;
    let tl: gsap.core.Timeline | null = null;

    const widthOf = (word: string) => {
      measure.textContent = word;
      return measure.getBoundingClientRect().width;
    };
    gsap.set(slot, { width: widthOf(HERO_WORDS[0]) });
    gsap.set(back, { yPercent: 100, opacity: 0 });

    const step = () => {
      index = (index + 1) % HERO_WORDS.length;
      const word = HERO_WORDS[index];
      back.textContent = word;
      const w = widthOf(word);
      tl = gsap.timeline({
        onComplete: () => {
          [front, back] = [back, front];
          schedule();
        },
      });
      if (reduced) {
        tl.to(front, { opacity: 0, duration: 0.25, ease: "none" })
          .set(slot, { width: w })
          .fromTo(back, { yPercent: 0, opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none" });
        return;
      }
      tl.to(front, { yPercent: -100, opacity: 0, filter: "blur(5px)", duration: 0.85, ease: EASE_SWAP }, 0)
        .fromTo(
          back,
          { yPercent: 100, opacity: 0, filter: "blur(5px)" },
          { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 0.85, ease: EASE_SWAP },
          0,
        )
        .to(slot, { width: w, duration: 0.85, ease: EASE_SWAP }, 0);
    };

    // Only roll while the line is on screen and the tab is visible.
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (inView && !document.hidden) step();
        else schedule();
      }, reduced ? HOLD_MS * 1.6 : HOLD_MS);
    };

    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
    io.observe(slot);

    // Wait for the loading screen to lift before the first roll.
    const html = document.documentElement;
    let mo: MutationObserver | null = null;
    if (html.dataset.loader === "play") {
      mo = new MutationObserver(() => {
        if (html.dataset.loader !== "play") {
          mo?.disconnect();
          schedule();
        }
      });
      mo.observe(html, { attributes: true, attributeFilter: ["data-loader"] });
    } else {
      schedule();
    }

    // Fonts may land after the first measure.
    document.fonts?.ready.then(() => gsap.set(slot, { width: widthOf(front.textContent || "") }));

    return () => {
      window.clearTimeout(timer);
      io.disconnect();
      mo?.disconnect();
      tl?.kill();
    };
  }, []);

  return (
    <p className={cn("relative text-[clamp(1.25rem,0.95rem+1.1vw,2rem)] leading-[1.3]", className)}>
      <span className="sr-only">{HERO_SENTENCE}</span>
      <span aria-hidden="true">
        <span className="whitespace-nowrap">
          Websites for{" "}
          <span ref={slotRef} className="word-slot">
            <span ref={aRef} className="inline-block">
              {HERO_WORDS[0]}
            </span>
            <span ref={bRef} className="absolute left-0 top-0 inline-block">
              {HERO_WORDS[1]}
            </span>
          </span>
          <span className="max-lg:hidden">,</span>
        </span>{" "}
        <br className="lg:hidden" />
        made in the Maldives.
        {/* Off-screen ruler for measuring the next word. */}
        <span ref={measureRef} className="invisible absolute left-0 top-0 whitespace-nowrap" />
      </span>
    </p>
  );
}
