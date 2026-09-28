"use client";

import { useRef, useState, type CSSProperties } from "react";
import { RevealText } from "@/components/motion/RevealText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Step } from "@/data/studio";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { pad2 } from "@/lib/utils";

/** The pool of prism light behind each step, one pair of dusty tones apiece. */
const GLOWS: [string, string][] = [
  ["rgb(43 102 148 / 0.8)", "rgb(83 136 148 / 0.4)"],
  ["rgb(148 138 86 / 0.75)", "rgb(148 104 66 / 0.4)"],
  ["rgb(148 80 67 / 0.75)", "rgb(148 103 121 / 0.4)"],
  ["rgb(106 90 143 / 0.8)", "rgb(43 102 148 / 0.4)"],
];

/*
 * The process, as four steps that take turns. As you scroll through the
 * section, one step at a time becomes active: fully white, with a soft,
 * heavily blurred pool of prism light behind it. The others rest dimmed.
 * No lines, dots or tracks; everything crossfades slowly. On desktop the
 * section holds still while the steps take their turn; on smaller screens
 * the steps stack and each one lights as it reaches the middle of the
 * screen. With reduced motion every step is fully visible, with no glow.
 */
export function ProcessSteps({
  steps,
  index = 5,
  title = "From first chat to launch, and after.",
  id = "process",
}: {
  steps: Step[];
  index?: number;
  title?: string;
  id?: string;
}) {
  const pinRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const n = steps.length;
      const mm = gsap.matchMedia();
      mm.add(
        {
          wide: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
          narrow: "(max-width: 1023px) and (prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          if ((ctx.conditions as Record<string, boolean>).wide) {
            ScrollTrigger.create({
              trigger: pinRef.current,
              start: "top top",
              end: () => `+=${window.innerHeight * 1.6}`,
              pin: true,
              onUpdate: (self) => setActive(Math.min(n - 1, Math.floor(self.progress * n))),
            });
            return;
          }
          gsap.utils.toArray<HTMLElement>("[data-step]", listRef.current).forEach((item, i) => {
            ScrollTrigger.create({
              trigger: item,
              start: "top 62%",
              end: "bottom 62%",
              onToggle: (self) => self.isActive && setActive(i),
            });
          });
        },
      );
    },
    { scope: pinRef },
  );

  return (
    <section id={id} data-light="process" aria-labelledby={`${id}-title`} className="relative overflow-x-clip">
      <div ref={pinRef} className="px-site section-y lg:flex lg:h-svh lg:flex-col lg:justify-center lg:py-0 lg:pt-(--header-h)">
        <SectionLabel index={index}>How it works</SectionLabel>
        <RevealText id={`${id}-title`} className="mt-8 max-w-[15ch] text-h2">
          {title}
        </RevealText>

        <ol
          ref={listRef}
          className="mt-[clamp(56px,10vh,120px)] grid gap-14 lg:grid-cols-4 lg:gap-(--gutter)"
        >
          {steps.map((s, i) => {
            const [a, b] = GLOWS[i % GLOWS.length];
            return (
              <li
                key={s.name}
                data-step
                data-active={active === i}
                aria-current={active === i ? "step" : undefined}
                className="step"
              >
                <span
                  aria-hidden="true"
                  className="step-glow"
                  style={{ "--glow-a": a, "--glow-b": b } as CSSProperties}
                />
                <p className="label tabular-nums">{pad2(i + 1)}</p>
                <h3 className="mt-3 text-h3">{s.name}</h3>
                <p className="mt-4 font-display text-[1.0625rem] leading-snug">{s.title}</p>
                <p className="mt-2 max-w-[24em] text-small">{s.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
