"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, prefersReducedMotion, REVEAL_START, STAGGER } from "@/lib/motion";

/**
 * A light fade and rise as the block scrolls into view. Used for body copy
 * and small groups; headings use RevealText. If the block contains
 * `[data-reveal-item]` children, those rise one after another instead.
 */
export function Reveal({
  as: Tag = "div",
  children,
  className,
  delay = 0,
  y = 18,
  id,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const items = el.querySelectorAll("[data-reveal-item]");
      gsap.from(items.length ? items : el, {
        autoAlpha: 0,
        y,
        duration: DUR.slow,
        ease: EASE,
        delay,
        stagger: items.length ? STAGGER : 0,
        scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
