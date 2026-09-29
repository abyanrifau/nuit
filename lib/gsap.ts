"use client";

/* GSAP with its plugins registered once, for every client component. */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  gsap.defaults({ ease: "expo.out", duration: 1 });
  // Mobile address bars resize the viewport while scrolling; ignoring those
  // resizes keeps pinned sections from jumping.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/**
 * SplitText, fetched the first time a heading needs splitting (headings
 * split as they near the screen), so it is not part of every page's
 * startup JavaScript.
 */
let splitText: Promise<typeof import("gsap/SplitText").SplitText> | null = null;
export function loadSplitText() {
  splitText ??= import("gsap/SplitText").then(({ SplitText }) => {
    gsap.registerPlugin(SplitText);
    return SplitText;
  });
  return splitText;
}

// Fetched quietly once the page has loaded and gone idle, so it is ready
// long before any heading needs it.
if (typeof window !== "undefined") {
  const warm = () => (window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1)))(() => void loadSplitText());
  if (document.readyState === "complete") warm();
  else window.addEventListener("load", warm, { once: true });
}

export { gsap, ScrollTrigger, useGSAP };
