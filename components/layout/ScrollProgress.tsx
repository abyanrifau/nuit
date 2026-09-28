"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * A thin white line along the top edge that fills from left to right as you
 * scroll down the page, as on the previous site. It stands in for the hidden
 * scrollbar and starts again from empty on every page.
 */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${p})`;
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // The page grows and shrinks as sections pin and media loads.
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
    };
  }, [pathname]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[65] h-[2px] origin-left bg-fg"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
