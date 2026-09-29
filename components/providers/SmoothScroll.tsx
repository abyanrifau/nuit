"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/*
 * Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger and Lenis
 * always agree on the position. Off entirely with reduced motion, where the
 * page scrolls natively. Touch keeps native scrolling either way.
 */

type ScrollTarget = number | string | HTMLElement;
type ScrollOptions = { offset?: number; immediate?: boolean; duration?: number };

type Ctx = {
  lenis: Lenis | null;
  scrollTo: (target: ScrollTarget, opts?: ScrollOptions) => void;
  stop: () => void;
  start: () => void;
};

const SmoothScrollContext = createContext<Ctx>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useSmoothScroll = () => useContext(SmoothScrollContext);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Reduced motion scrolls natively; so do touch-only devices, where Lenis
    // would only pass native touch scrolling through anyway.
    if (prefersReducedMotion() || !window.matchMedia("(hover: hover)").matches) return;
    const instance = new Lenis({
      lerp: 0.11,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
    });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // The loading screen holds the page still (html[data-scroll-lock]);
    // Lenis scrolls by script, so it is paused too until the lock lifts.
    const html = document.documentElement;
    const syncLock = () => ("scrollLock" in html.dataset ? instance.stop() : instance.start());
    syncLock();
    const lock = new MutationObserver(syncLock);
    lock.observe(html, { attributes: true, attributeFilter: ["data-scroll-lock"] });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the instance only exists on the client
    setLenis(instance);
    return () => {
      lock.disconnect();
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  const scrollTo = useCallback(
    (target: ScrollTarget, opts: ScrollOptions = {}) => {
      const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
      if (el === null) return;
      if (lenis) {
        lenis.scrollTo(el, {
          offset: opts.offset ?? 0,
          immediate: opts.immediate,
          duration: opts.duration ?? 1.4,
          force: true,
        });
        return;
      }
      const top =
        typeof el === "number" ? el : el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
      window.scrollTo({ top, behavior: opts.immediate || prefersReducedMotion() ? "auto" : "smooth" });
    },
    [lenis],
  );

  const value = useMemo<Ctx>(
    () => ({
      lenis,
      scrollTo,
      stop: () => lenis?.stop(),
      // Never while the loading screen holds the page still.
      start: () => {
        if (!("scrollLock" in document.documentElement.dataset)) lenis?.start();
      },
    }),
    [lenis, scrollTo],
  );

  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}
