/*
 * The motion system. A soft ease-out for things arriving ("power3.out"),
 * an even in-out for things trading places ("expo.inOut"), and a short
 * timing scale. CSS mirrors these as --ease-soft, --ease-in-out and --dur-*
 * in app/globals.css.
 */

export const EASE = "expo.out";
export const EASE_SOFT = "power3.out";
export const EASE_SWAP = "expo.inOut";
export const EASE_IN = "expo.in";

export const DUR = {
  fast: 0.3,
  base: 0.6,
  slow: 1,
  hero: 1.2,
} as const;

/** Delay between lines or items in a staggered reveal. */
export const STAGGER = 0.08;

/** Where scroll-triggered reveals start: the element's top at 86% of the viewport. */
export const REVEAL_START = "top 86%";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Desktop pointer that can hover precisely: gets the cursor and light pull. */
export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
