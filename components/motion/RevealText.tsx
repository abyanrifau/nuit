"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, loadSplitText, useGSAP } from "@/lib/gsap";
import { EASE_SOFT, prefersReducedMotion, REVEAL_START } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A heading that reveals line by line as it scrolls into view: each line
 * goes from clear and slightly blurred to sharp, with no movement (0.9s a
 * line, 80ms apart). Lines are measured by SplitText (fetched on first
 * use) and re-measured when fonts load or the width changes. With reduced
 * motion the text is simply there.
 *
 * Headings visible on first paint (page titles) use the CSS `enter-blur`
 * class instead, which looks the same and never waits on JavaScript.
 *
 * `defer` is for long text that sits close to the top of a page: the lines
 * are measured when the browser is next idle, as their own small task,
 * instead of during page load. The text stays hidden until then (.reveal-defer
 * in globals.css), so it never shows unsplit and then flickers.
 */
export function RevealText({
  as: Tag = "h2",
  children,
  className,
  delay = 0,
  id,
  defer = false,
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
  defer?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      // Split only when the heading is within a screen of the viewport, so
      // page load does not pay for measuring every heading at once.
      let alive = true;
      const split = contextSafe!((SplitText: Awaited<ReturnType<typeof loadSplitText>>) => {
        if (!alive) return;
        el.classList.add("is-split");
        SplitText.create(el, {
          type: "lines",
          linesClass: "reveal-line",
          // Headings get an aria-label with the whole line; other elements
          // (where aria-label is not allowed) are read line by line as-is.
          aria: typeof Tag === "string" && /^h[1-6]$/.test(Tag) ? "auto" : "none",
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              opacity: 0,
              filter: "blur(7px)",
              duration: 0.9,
              ease: EASE_SOFT,
              stagger: 0.08,
              delay,
              clearProps: "filter",
              scrollTrigger: { trigger: el, start: REVEAL_START, once: true },
            });
          },
        });
      });
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          if (!defer) return void loadSplitText().then(split);
          const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
          idle(() => void loadSplitText().then(split), { timeout: 1200 });
        },
        { rootMargin: "0px 0px 100% 0px" },
      );
      io.observe(el);
      return () => {
        alive = false;
        io.disconnect();
      };
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} id={id} className={defer ? cn("reveal-defer", className) : className}>
      {children}
    </Tag>
  );
}
