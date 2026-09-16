"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useEffect, useState } from "react";
import { useLenis } from "@/components/SmoothScroll";

const COUNT_DURATION = 2.2; // seconds for 0 to 100
const INTRO_DELAY = 0.2; // wordmark letters start rising
const HOLD = 0.35; // pause at 100 before the wipe
const TOTAL_MS = (INTRO_DELAY + COUNT_DURATION + HOLD) * 1000;

const WORDMARK = "Nuit Works.";

export function Preloader() {
  // Rendered on first paint so the page never flashes before it appears.
  const [visible, setVisible] = useState(true);
  const { lenis } = useLenis();
  const reduced = useReducedMotion();

  const progress = useMotionValue(0);
  const counter = useTransform(progress, (v) => Math.round(v).toString());
  const lineScale = useTransform(progress, [0, 100], [0, 1]);

  useEffect(() => {
    const controls = animate(progress, reduced ? 100 : [0, 34, 52, 88, 100], {
      duration: reduced ? 0 : COUNT_DURATION,
      delay: reduced ? 0 : INTRO_DELAY,
      // Counts in surges with brief breaths between, still moving at the end.
      times: reduced ? undefined : [0, 0.28, 0.5, 0.82, 1],
      ease: "easeInOut",
    });
    const timer = window.setTimeout(() => setVisible(false), TOTAL_MS);
    return () => {
      controls.stop();
      window.clearTimeout(timer);
    };
  }, [progress, reduced]);

  // Lock scrolling while the preloader is up.
  useEffect(() => {
    if (!visible) return;
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      lenis?.start();
    };
  }, [visible, lenis]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-preloader
          aria-hidden="true"
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 1, ease: [0.4, 0, 0.2, 1] }}
          className="gutter fixed inset-0 z-[70] flex flex-col justify-center bg-white text-black"
        >
          <div className="flex items-end justify-between">
            {/* Wordmark: letters rise in one by one */}
            <p
              className="flex overflow-hidden font-grotesk text-xl leading-none tracking-[-0.02em] md:text-2xl"
              aria-label={WORDMARK}
            >
              {WORDMARK.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={reduced ? false : { y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: INTRO_DELAY + i * 0.035,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {ch === " " ? " " : ch}
                </motion.span>
              ))}
            </p>

            <motion.p
              className="font-neue text-[13px] leading-none tabular-nums"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: INTRO_DELAY + 0.3 }}
            >
              {counter}
            </motion.p>
          </div>

          {/* Hairline drawing across the page */}
          <div className="mt-5 h-px w-full bg-white">
            <motion.div
              style={{ scaleX: lineScale }}
              className="h-full w-full origin-left bg-black"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
