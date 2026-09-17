"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

/*
 * GradualBlur, adapted from React Bits (https://reactbits.dev), component by
 * Ansh Dhanani. Stacks masked backdrop-filter layers so content dissolves
 * into a progressively stronger blur toward one edge.
 */

type Position = "top" | "bottom" | "left" | "right";
type Curve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";

type GradualBlurProps = {
  position?: Position;
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  curve?: Curve;
  opacity?: number;
  /** true fades in on mount; "scroll" reveals when the element is in view. */
  animated?: boolean | "scroll";
  duration?: string;
  easing?: string;
  hoverIntensity?: number;
  /** "parent" positions inside the nearest positioned ancestor; "page" is fixed to the viewport. */
  target?: "parent" | "page";
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
  onAnimationComplete?: () => void;
};

const CURVES: Record<Curve, (p: number) => number> = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const DIRECTION: Record<Position, string> = {
  top: "to top",
  bottom: "to bottom",
  left: "to left",
  right: "to right",
};

export default function GradualBlur({
  position = "bottom",
  strength = 2,
  height = "6rem",
  width,
  divCount = 5,
  exponential = false,
  curve = "linear",
  opacity = 1,
  animated = false,
  duration = "0.3s",
  easing = "ease-out",
  hoverIntensity,
  target = "parent",
  zIndex = 1000,
  className,
  style,
  onAnimationComplete,
}: GradualBlurProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(animated !== "scroll");

  useEffect(() => {
    if (animated !== "scroll" || !ref.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [animated]);

  useEffect(() => {
    if (!visible || animated !== "scroll" || !onAnimationComplete) return;
    const t = window.setTimeout(onAnimationComplete, parseFloat(duration) * 1000);
    return () => window.clearTimeout(t);
  }, [visible, animated, onAnimationComplete, duration]);

  const layers = useMemo(() => {
    const increment = 100 / divCount;
    const base = hovered && hoverIntensity ? strength * hoverIntensity : strength;
    const curveFn = CURVES[curve] ?? CURVES.linear;
    const direction = DIRECTION[position];
    const out: CSSProperties[] = [];
    for (let i = 1; i <= divCount; i++) {
      const progress = curveFn(i / divCount);
      const blur = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * base
        : 0.0625 * (progress * divCount + 1) * base;
      const p1 = Math.round((increment * i - increment) * 10) / 10;
      const p2 = Math.round(increment * i * 10) / 10;
      const p3 = Math.round((increment * i + increment) * 10) / 10;
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10;
      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;
      const mask = `linear-gradient(${direction}, ${gradient})`;
      out.push({
        position: "absolute",
        inset: 0,
        maskImage: mask,
        WebkitMaskImage: mask,
        backdropFilter: `blur(${blur.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blur.toFixed(3)}rem)`,
        opacity,
        transition:
          animated && animated !== "scroll" ? `backdrop-filter ${duration} ${easing}` : undefined,
      });
    }
    return out;
  }, [divCount, hovered, hoverIntensity, strength, curve, position, exponential, opacity, animated, duration, easing]);

  const vertical = position === "top" || position === "bottom";
  const page = target === "page";
  const containerStyle: CSSProperties = {
    position: page ? "fixed" : "absolute",
    pointerEvents: hoverIntensity ? "auto" : "none",
    opacity: visible ? 1 : 0,
    transition: animated ? `opacity ${duration} ${easing}` : undefined,
    zIndex: page ? zIndex + 100 : zIndex,
    isolation: "isolate",
    overflow: "hidden",
    ...(vertical
      ? { height, width: width ?? "100%", [position]: 0, left: 0, right: 0 }
      : { width: width ?? height, height: "100%", [position]: 0, top: 0, bottom: 0 }),
    ...style,
  };

  return (
    <div
      ref={ref}
      data-gradual-blur={position}
      aria-hidden="true"
      className={className}
      style={containerStyle}
      onMouseEnter={hoverIntensity ? () => setHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setHovered(false) : undefined}
    >
      <div style={{ position: "relative", width: "100%", height: "100%", pointerEvents: "none" }}>
        {layers.map((s, i) => (
          <div key={i} style={s} />
        ))}
      </div>
    </div>
  );
}
