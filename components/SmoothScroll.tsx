"use client";

import Lenis from "lenis";
import { RELEASE_ALL_EVENT } from "@/lib/events";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type LenisContextValue = {
  lenis: Lenis | null;
  reducedMotion: boolean;
};

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  reducedMotion: false,
});

export const NAV_HEIGHT = 64;
const SCROLL_OFFSET = -(NAV_HEIGHT + 32);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | null = null;

    const start = () => {
      const created = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      const raf = (time: number) => {
        created.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      };
      rafRef.current = requestAnimationFrame(raf);
      setLenis(created);
      return created;
    };

    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      instance?.destroy();
      instance = null;
      setLenis(null);
    };

    const apply = () => {
      setReducedMotion(media.matches);
      if (media.matches) {
        stop();
      } else if (!instance) {
        instance = start();
      }
    };

    apply();
    media.addEventListener("change", apply);
    return () => {
      media.removeEventListener("change", apply);
      stop();
    };
  }, []);

  return (
    <LenisContext.Provider value={{ lenis, reducedMotion }}>
      {children}
    </LenisContext.Provider>
  );
}

export function useLenis() {
  return useContext(LenisContext);
}

/** Smoothly scroll to a hash target (or a pixel position), offset for the fixed nav. */
export function useScrollTo() {
  const { lenis, reducedMotion } = useLenis();

  return useCallback(
    (target: string | number) => {
      const go = () => {
        const offset = typeof target === "number" ? 0 : SCROLL_OFFSET;
        let dest: string | number = target;

        // Pinned sections reveal their text over the first half of their height,
        // so a nav link lands where that reveal has finished.
        if (typeof dest === "string") {
          const pinnedEl = document.querySelector<HTMLElement>(`${dest}[data-pin]`);
          if (pinnedEl) dest = pinnedEl.offsetTop + pinnedEl.offsetHeight * 0.55;
        }

        if (lenis && !reducedMotion) {
          // Resolve the element to a pixel position ourselves against the real
          // scroll position; sections change height after their first pass and
          // Lenis's own element lookup can be left with stale measurements.
          let top = dest;
          if (typeof dest === "string") {
            const el = document.querySelector<HTMLElement>(dest);
            if (!el) return;
            top = el.getBoundingClientRect().top + window.scrollY;
          }
          lenis.resize();
          lenis.scrollTo(top, { offset });
          return;
        }

        const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
        if (typeof dest === "number") {
          window.scrollTo({ top: dest, behavior });
          return;
        }
        const el = document.querySelector<HTMLElement>(dest);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior });
      };

      // Release every pinned section first so nothing collapses mid-scroll and
      // interrupts the animation, then measure once the layout has settled.
      window.dispatchEvent(new Event(RELEASE_ALL_EVENT));
      requestAnimationFrame(() => requestAnimationFrame(go));
    },
    [lenis, reducedMotion],
  );
}
