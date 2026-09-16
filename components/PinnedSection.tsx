"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";
import { useLenis } from "@/components/SmoothScroll";

/** True on desktop pointers without reduced motion; pinning is skipped otherwise. */
export function usePinning() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      );
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () =>
      window.matchMedia(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      ).matches,
    () => false,
  );
}

/**
 * Once a section's first-pass animation is done and the section has left the
 * viewport, release its pin (collapse the extra height). If it left upwards,
 * the scroll position is corrected by the removed height in the same frame so
 * nothing on screen moves.
 */
export function useReleaseWhenOffscreen(
  ref: RefObject<HTMLElement | null>,
  doneRef: RefObject<boolean>,
) {
  const { lenis } = useLenis();
  const [released, setReleased] = useState(false);
  const pending = useRef<{ panelTop: number; keep: boolean } | null>(null);
  const lastY = useRef(0);

  useEffect(() => {
    if (released) return;
    lastY.current = window.scrollY;
    const check = () => {
      const y = window.scrollY;
      const goingUp = y < lastY.current;
      lastY.current = y;
      const el = ref.current;
      if (!el || !doneRef.current || pending.current) return;
      const r = el.getBoundingClientRect();
      // Release once the section is off screen, or as soon as the user scrolls
      // back up into a finished section so the hold never catches them twice.
      const offBelow = r.top >= window.innerHeight;
      const offAbove = r.bottom <= 0;
      const backInto = goingUp && r.top < 0;
      if (!offBelow && !offAbove && !backInto) return;
      const panel = el.firstElementChild as HTMLElement | null;
      pending.current = {
        panelTop: panel ? panel.getBoundingClientRect().top : 0,
        keep: !offBelow,
      };
      setReleased(true);
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [ref, doneRef, released]);

  useLayoutEffect(() => {
    if (!released || !pending.current || !ref.current) return;
    const { panelTop, keep } = pending.current;
    pending.current = null;
    const el = ref.current;
    if (keep) {
      // After collapsing, the panel sits at the section's top. Scroll so it
      // lands exactly where it was on screen a moment ago.
      const y = el.offsetTop - panelTop;
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }
    window.dispatchEvent(new Event("resize"));
  }, [released, ref, lenis]);

  return released;
}

type PinnedSectionProps = {
  id: string;
  /** Extra viewport heights to hold the panel for (1 = hold for one screen). */
  hold?: number;
  /** Optional full-bleed layer rendered behind the panel content. */
  background?: ReactNode;
  children: (progress: MotionValue<number>) => ReactNode;
};

/**
 * A section that sticks to the viewport while the user scrolls through its
 * extra height. `progress` runs 0 -> 1 from the section entering at the bottom
 * of the screen to the end of the hold, so children can animate against it.
 */
export function PinnedSection({ id, hold = 1, background, children }: PinnedSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const revealed = useMotionValue(1);

  // The reveal plays once per page load. After it completes, the text stays
  // fully shown no matter where the user scrolls afterwards.
  const progress = useMotionValue(0);
  const doneRef = useRef(false);
  // Pin only until the reveal has played and the section has scrolled away.
  const released = useReleaseWhenOffscreen(ref, doneRef);
  const pin = usePinning() && !released;
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (doneRef.current) return;
    if (v >= 0.98) {
      doneRef.current = true;
      progress.set(1);
    } else {
      progress.set(v);
    }
    ref.current?.setAttribute("data-progress", progress.get().toFixed(3));
  });

  // One stable element tree in both modes, so the scroll tracker's ref never
  // points at an unmounted node when pinning switches on after hydration.
  return (
    <section
      id={id}
      ref={ref}
      data-pin={pin ? "" : undefined}
      className={cn("relative", !pin && (released ? "flex min-h-screen flex-col justify-center" : "section-gap"))}
      style={{ height: pin ? `${(1 + hold) * 100}vh` : undefined }}
    >
      <motion.div
        initial={pin || released || reduced ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn(
          "gutter relative isolate flex flex-col justify-center",
          pin && "sticky top-0 h-screen",
          released && "min-h-screen",
        )}
      >
        {background && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            {background}
          </div>
        )}
        {children(pin || released ? progress : revealed)}
      </motion.div>
    </section>
  );
}

/** Maps a progress value onto 0..1 across a range, clamped. */
const unit = (v: number, [a, b]: [number, number]) =>
  Math.min(1, Math.max(0, (v - a) / (b - a)));

type RevealProps = {
  progress: MotionValue<number>;
  /** Progress window over which this block fades and rises in. */
  range?: [number, number];
  className?: string;
  children: ReactNode;
};

/** Fades and rises a block in across a slice of the scroll progress. */
export function Reveal({
  progress,
  range = [0.4, 0.7],
  className,
  children,
}: RevealProps) {
  const opacity = useTransform(progress, (v) => unit(v, range));
  const y = useTransform(progress, (v) => 24 * (1 - unit(v, range)));
  return (
    <motion.div style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

type RevealWordsProps = {
  progress: MotionValue<number>;
  text: string;
  range?: [number, number];
  className?: string;
  as?: "h2" | "p";
};

/** Reveals a line of text word by word as the scroll progress advances. */
export function RevealWords({
  progress,
  text,
  range = [0.4, 0.75],
  className,
  as = "p",
}: RevealWordsProps) {
  const words = text.split(" ");
  const [a, b] = range;
  const step = (b - a) / words.length;
  const Tag = as;

  return (
    <Tag className={cn("flex flex-wrap", className)} aria-label={text}>
      {words.map((word, i) => (
        <Word
          key={`${word}-${i}`}
          progress={progress}
          range={[a + step * i, Math.min(b, a + step * i + step * 2.5)]}
          word={word}
          last={i === words.length - 1}
        />
      ))}
    </Tag>
  );
}

function Word({
  progress,
  range,
  word,
  last,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  word: string;
  last: boolean;
}) {
  const opacity = useTransform(progress, (v) => unit(v, range));
  const y = useTransform(progress, (v) => `${0.4 * (1 - unit(v, range))}em`);
  return (
    <motion.span style={{ opacity, y }} className="inline-block" aria-hidden="true">
      {word}
      {last ? "" : " "}
    </motion.span>
  );
}
