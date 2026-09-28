"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A very slight pull toward the pointer while it is over the element: at
 * most a few pixels (5 by default), reached with a soft, damped follow. When
 * the pointer leaves, it eases back to rest over half a second. No bounce,
 * no overshoot, no scaling. Desktop with a fine pointer only; nothing
 * happens on touch or with reduced motion.
 */
export function Magnetic({
  children,
  max = 5,
  className,
}: {
  children: ReactNode;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;
    // A gentle curve, so the return to rest reads as the full half second.
    const opts = { duration: 0.5, ease: "power2.out" };
    const xTo = gsap.quickTo(el, "x", opts);
    const yTo = gsap.quickTo(el, "y", opts);
    // The element's resting box, measured without its current offset so the
    // pull never feeds back on itself.
    let box = { cx: 0, cy: 0, hw: 1, hh: 1 };
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));

    const enter = () => {
      const r = el.getBoundingClientRect();
      box = {
        cx: r.left - Number(gsap.getProperty(el, "x")) + r.width / 2,
        cy: r.top - Number(gsap.getProperty(el, "y")) + r.height / 2,
        hw: Math.max(1, r.width / 2),
        hh: Math.max(1, r.height / 2),
      };
    };
    const move = (e: PointerEvent) => {
      xTo(clamp((e.clientX - box.cx) / box.hw) * max);
      yTo(clamp((e.clientY - box.cy) / box.hh) * max);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.set(el, { clearProps: "transform" });
    };
  }, [max]);

  return (
    <span ref={ref} className={cn("inline-block", className)}>
      {children}
    </span>
  );
}
