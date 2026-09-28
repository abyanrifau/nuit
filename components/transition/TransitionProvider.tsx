"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/*
 * Page transitions: a clean fade. The current page fades out (250ms), the
 * route changes while nothing is showing, the new page starts at the top and
 * fades in (400ms). No movement, no overlays. The browser's back and forward
 * buttons get the same fade in, also from the top. With reduced motion,
 * pages switch instantly.
 *
 * Only the page itself fades (the element marked `data-page`); the header
 * and the background light stay put.
 *
 * html[data-transition] is "cover" while the old page fades out and the new
 * one mounts, and "reveal" while it fades in. Entrance animations on the new
 * page are paused during "cover" (see globals.css), so they start exactly as
 * the page appears.
 */

type Ctx = { navigate: (href: string) => void };
const TransitionContext = createContext<Ctx>({ navigate: () => {} });
export const usePageTransition = () => useContext(TransitionContext);

const OUT_S = 0.25;
const IN_S = 0.4;

const pageEl = () => document.querySelector<HTMLElement>("[data-page]");

const setState = (s: "cover" | "reveal" | null) => {
  const el = document.documentElement;
  if (s) el.dataset.transition = s;
  else delete el.dataset.transition;
};

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { scrollTo, stop, start, lenis } = useSmoothScroll();
  const pending = useRef<{ path: string; hash: string } | null>(null);
  const busy = useRef(false);
  const safety = useRef(0);
  const lastPath = useRef(pathname);

  // The site decides where a new page starts (the top), not the browser:
  // turn off the browser's scroll restoration (which would otherwise put a
  // page reached with Back where it was left) and ScrollTrigger's memory.
  useEffect(() => {
    ScrollTrigger.clearScrollMemory("manual");
  }, []);

  const toTop = useCallback(() => {
    window.scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [lenis]);

  /** The new page has rendered (still invisible): place it at the top and fade it in. */
  const fadeIn = useCallback(
    (hash?: string) => {
      window.clearTimeout(safety.current);
      const el = pageEl();
      toTop();
      start();
      setState("reveal");
      // Measure the new page's scroll effects from the top, then make sure
      // nothing (a restored position, a remembered one) has moved it.
      requestAnimationFrame(() => {
        ScrollTrigger.clearScrollMemory("manual");
        ScrollTrigger.refresh();
        toTop();
      });
      const done = () => {
        setState(null);
        busy.current = false;
        if (el) gsap.set(el, { clearProps: "opacity,pointerEvents" });
        if (hash) scrollTo(hash, { offset: -40 });
      };
      if (!el || prefersReducedMotion()) return done();
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: IN_S, ease: "power1.out", overwrite: true, onComplete: done });
    },
    [scrollTo, start, toTop],
  );

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      const here = window.location;
      if (url.origin !== here.origin) {
        window.location.assign(href);
        return;
      }
      if (url.pathname === here.pathname) {
        if (url.search !== here.search) router.push(url.pathname + url.search + url.hash, { scroll: false });
        else scrollTo(url.hash || 0, { offset: url.hash ? -40 : 0 });
        return;
      }
      if (busy.current) return;
      busy.current = true;
      pending.current = { path: url.pathname, hash: url.hash };
      const go = () => router.push(url.pathname + url.search, { scroll: false });

      setState("cover");
      stop();
      // Never leave the page invisible if the route is slow or fails.
      safety.current = window.setTimeout(() => fadeIn(), 4000);

      const el = pageEl();
      if (!el || prefersReducedMotion()) return go();
      gsap.set(el, { pointerEvents: "none" });
      gsap.to(el, { opacity: 0, duration: OUT_S, ease: "power1.in", overwrite: true, onComplete: go });
    },
    [fadeIn, router, scrollTo, stop],
  );

  // A new route has rendered. Runs before paint, so the new page is never
  // seen at the old scroll position. Only a real change of path counts (the
  // callbacks' identities change once Lenis is ready).
  useLayoutEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (pending.current && pending.current.path === pathname) {
      const hash = pending.current.hash;
      pending.current = null;
      fadeIn(hash);
      return;
    }
    // Back, forward, or any other change of page: from the top, with the same fade in.
    pending.current = null;
    busy.current = true;
    const el = pageEl();
    if (el && !prefersReducedMotion()) gsap.set(el, { opacity: 0 });
    fadeIn();
  }, [pathname, fadeIn]);

  return <TransitionContext.Provider value={{ navigate }}>{children}</TransitionContext.Provider>;
}
