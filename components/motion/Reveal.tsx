"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DUR, EASE, prefersReducedMotion, REVEAL_START, STAGGER } from "@/lib/motion";

/**
 * A light fade and rise as the block scrolls into view. Used for body copy
 * and small groups; headings use RevealText. If the block contains
 * `[data-reveal-item]` children, those rise one after another instead.
 *
 * The block is hidden straight away (a style write, no layout reads), but
 * its scroll trigger, which has to measure the page, is only created when
 * the block comes within a screen of view (or is already above it), so
 * opening a page does not pay for measuring every block at once.
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
    (_, contextSafe) => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const items = el.querySelectorAll("[data-reveal-item]");
      const targets = items.length ? items : el;
      gsap.set(targets, { autoAlpha: 0, y });
      const arm = contextSafe!(() => {
        gsap.to(targets, {
          autoAlpha: 1,
          y: 0,
          duration: DUR.slow,
          ease: EASE,
          delay,
          stagger: items.length ? STAGGER : 0,
          scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
        });
      });
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
          io.disconnect();
          arm();
        },
        { rootMargin: "0px 0px 100% 0px" },
      );
      io.observe(el);
      return () => io.disconnect();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} className={className}>
      {children}
    </Tag>
  );
}
