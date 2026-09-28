"use client";

import { useSmoothScroll } from "@/components/providers/SmoothScroll";

export function BackToTop() {
  const { scrollTo } = useSmoothScroll();
  return (
    <button type="button" onClick={() => scrollTo(0, { duration: 1.8 })} className="link">
      Back to top
    </button>
  );
}
