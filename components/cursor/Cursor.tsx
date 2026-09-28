"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/*
 * The cursor: one small white dot, blended with "difference" so it reads on
 * any background. It follows the pointer with only a slight smoothing. Over
 * anything clickable (links, buttons, project cards) it grows to twice its
 * size and softens a little; over text fields it steps aside so the normal
 * caret shows. Nothing else: no ring, no trail, no labels.
 *
 * It stays hidden until the pointer first moves, so it is never seen parked
 * in a corner, and fades out when the pointer leaves the window. Desktop
 * with a fine pointer only; touch screens and reduced motion keep the
 * system cursor.
 */

type State = "idle" | "link" | "field";

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(hasFinePointer() && !prefersReducedMotion());
    update();
    mq.addEventListener("change", update);
    rm.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      rm.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current!;
    const dot = dotRef.current!;
    document.documentElement.classList.add("has-cursor");

    const xTo = gsap.quickTo(root, "x", { duration: 0.1, ease: "power3.out" });
    const yTo = gsap.quickTo(root, "y", { duration: 0.1, ease: "power3.out" });
    let shown = false;
    let state: State = "idle";

    const show = (on: boolean) => {
      if (on === shown) return;
      shown = on;
      gsap.to(root, { opacity: on ? 1 : 0, duration: 0.25, ease: "power2.out", overwrite: "auto" });
    };
    const apply = (next: State) => {
      if (next === state) return;
      state = next;
      gsap.to(dot, {
        scale: next === "link" ? 2 : 1,
        opacity: next === "field" ? 0 : next === "link" ? 0.7 : 1,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!shown) {
        // Start exactly under the pointer, then fade in.
        xTo(e.clientX, e.clientX);
        yTo(e.clientY, e.clientY);
        show(true);
        return;
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest("input, textarea, select, [contenteditable='true']")) apply("field");
      else if (t?.closest("a, button, [role='button'], label, summary")) apply("link");
      else apply("idle");
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) show(false);
    };
    const onBlur = () => show(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("mouseout", onLeave);
    window.addEventListener("blur", onBlur);

    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("mouseout", onLeave);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] opacity-0"
      style={{ mixBlendMode: "difference", willChange: "transform" }}
    >
      <div ref={dotRef} className="-ml-[3px] -mt-[3px] size-[6px] rounded-full bg-white" />
    </div>
  );
}
