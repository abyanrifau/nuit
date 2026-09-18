"use client";

import {
  m,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  useCallback,
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
import { RELEASE_ALL_EVENT } from "@/lib/events";

// Pinning needs a wide screen and a mouse or trackpad: touch momentum cannot be
// corrected mid-flight, so tablets and landscape phones scroll normally.
const PIN_QUERY =
  "(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/** True on desktop pointers without reduced motion; pinning is skipped otherwise. */
export function usePinning() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(PIN_QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(PIN_QUERY).matches,
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
  /** Only pinned sections ever need releasing; on mobile this stays off. */
  enabled: boolean,
  /** Marks the section's animation complete when a release is forced. */
  onForce?: () => void,
) {
  const { lenis } = useLenis();
  const [released, setReleased] = useState(false);
  const pending = useRef<{ panelTop: number; keep: boolean } | null>(null);
  const lastY = useRef(0);
  const settle = useRef(0);

  useEffect(() => {
    if (!enabled || released) return;
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
      const commit = () => {
        if (pending.current) return;
        const now = el.getBoundingClientRect();
        const stillOffscreen = now.bottom <= 0 || now.top >= window.innerHeight;
        if (!stillOffscreen && !backInto) return;
        const panel = el.firstElementChild as HTMLElement | null;
        pending.current = {
          panelTop: panel ? panel.getBoundingClientRect().top : 0,
          keep: now.top < window.innerHeight,
        };
        setReleased(true);
      };
      if (offAbove && !goingUp) {
        // Collapsing a section above the viewport needs a scroll correction,
        // which would cut the smooth-scroll momentum mid-flight. Wait until
        // scrolling settles so the correction is never felt.
        window.clearTimeout(settle.current);
        settle.current = window.setTimeout(commit, 160);
        return;
      }
      commit();
    };
    const force = () => {
      onForce?.();
      const el = ref.current;
      if (!el || pending.current) return;
      const panel = el.firstElementChild as HTMLElement | null;
      const r = el.getBoundingClientRect();
      pending.current = {
        panelTop: panel ? panel.getBoundingClientRect().top : 0,
        keep: r.top < window.innerHeight,
      };
      setReleased(true);
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener(RELEASE_ALL_EVENT, force);
    return () => {
      window.clearTimeout(settle.current);
      window.removeEventListener("scroll", check);
      window.removeEventListener(RELEASE_ALL_EVENT, force);
    };
  }, [ref, doneRef, released, enabled, onForce]);

  useLayoutEffect(() => {
    if (!released || !pending.current || !ref.current) return;
    const { panelTop, keep } = pending.current;
    pending.current = null;
    const el = ref.current;
    const panel = el.firstElementChild as HTMLElement | null;
    if (keep && panel) {
      // After collapsing, the panel sits statically inside the section's top
      // padding. Scroll so it lands exactly where it was on screen a moment
      // ago, measured from its new document position.
      const y = panel.getBoundingClientRect().top + window.scrollY - panelTop;
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
  const canPin = usePinning();
  const forceDone = useCallback(() => {
    doneRef.current = true;
    progress.set(1);
  }, [progress]);
  const released = useReleaseWhenOffscreen(ref, doneRef, canPin, forceDone);
  const pin = canPin && !released;
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

  // The panel is content-sized and sticks at whatever offset centres it in
  // the viewport, so the padding above and below it stays a constant two pads
  // between sections. The hold is extra bottom padding the panel stays stuck
  // through; releasing simply removes it.
  const panelRef = useRef<HTMLDivElement>(null);
  const [stickTop, setStickTop] = useState(64);
  useEffect(() => {
    const el = panelRef.current;
    if (!el || !pin) return;
    const measure = () => {
      const top = Math.max(64, Math.round((window.innerHeight - el.offsetHeight) / 2));
      setStickTop((prev) => (prev === top ? prev : top));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pin]);

  return (
    <section
      id={id}
      ref={ref}
      data-pin={pin ? "" : undefined}
      className="relative section-pad"
    >
      <m.div
        ref={panelRef}
        initial={pin || released || reduced ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={cn("gutter relative isolate", pin && "sticky")}
        style={pin ? { top: stickTop } : undefined}
      >
        {background && (
          // A full viewport of background centred on the panel, spilling into
          // the padding so it still reads as a full-bleed section.
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-screen -translate-y-1/2"
          >
            {background}
          </div>
        )}
        {children(pin || released ? progress : revealed)}
      </m.div>
      {/* The hold: scroll distance the stuck panel rides through. A real element
          rather than padding, since sticky panels cannot travel into padding. */}
      {pin && <div aria-hidden="true" style={{ height: `${hold * 100}vh` }} />}
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
  /** Render as a list item when the block sits directly inside a list. */
  as?: "div" | "li";
  children: ReactNode;
};

/** Fades and rises a block in across a slice of the scroll progress. */
export function Reveal({
  progress,
  range = [0.4, 0.7],
  className,
  as = "div",
  children,
}: RevealProps) {
  const opacity = useTransform(progress, (v) => unit(v, range));
  const y = useTransform(progress, (v) => 24 * (1 - unit(v, range)));
  const Tag = as === "li" ? m.li : m.div;
  return (
    <Tag style={{ opacity, y }} className={className}>
      {children}
    </Tag>
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
    <Tag className={cn("flex flex-wrap", className)}>
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
    <m.span style={{ opacity, y }} className="inline-block">
      {word}
      {last ? "" : " "}
    </m.span>
  );
}
