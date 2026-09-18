"use client";

import { m, useScroll } from "framer-motion";

/** Thin black line along the top edge showing how far down the page you are. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <m.div
      data-scroll-progress
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className="pointer-events-none fixed inset-x-0 top-0 z-[65] h-[2px] origin-left bg-black"
    />
  );
}
