"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

/** True once the element has come within `margin` of the viewport; stays true. */
export function useNearViewport(ref: RefObject<Element | null>, margin = "600px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setNear(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, near, margin]);
  return near;
}

/** True once the page has loaded and the main thread has had an idle moment. */
export function useAfterIdle(timeout = 2000) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const go = () => {
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(() => setReady(true), { timeout });
      } else {
        timer = window.setTimeout(() => setReady(true), 200);
      }
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, [timeout]);
  return ready;
}

type LazyMountProps = {
  children: ReactNode;
  /** Shown in the same box until the children mount, so nothing shifts. */
  placeholder?: ReactNode;
  margin?: string;
  className?: string;
};

/** Mounts its children only once the wrapper is near the viewport. */
export function LazyMount({ children, placeholder = null, margin, className }: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useNearViewport(ref, margin);
  return (
    <div ref={ref} className={className}>
      {near ? children : placeholder}
    </div>
  );
}
