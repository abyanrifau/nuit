"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { cn } from "@/lib/utils";
import { ConceptCarousel } from "@/components/ConceptCarousel";
import { ConceptPreview } from "@/components/ConceptPreview";
import { usePinning, useReleaseWhenOffscreen } from "@/components/PinnedSection";
import { concepts } from "@/data/concepts";

// Screens of scroll spent stepping through the concepts.
const TOUR_HOLD = 5;
// Share of the pinned progress used for stepping; the rest holds on the last one.
const TOUR_SPAN = 0.88;

export function Concepts() {
  const [active, setActive] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // On desktop the section pins and scroll drives the carousel through all six
  // concepts on the first pass. Once that's done and the section is off screen,
  // the pin is released and it becomes a normal section.
  const touredRef = useRef(false);
  const pin = usePinning();
  const forceToured = useCallback(() => {
    touredRef.current = true;
    swiperRef.current?.autoplay?.start();
  }, []);
  const released = useReleaseWhenOffscreen(sectionRef, touredRef, pin, forceToured);
  const pinned = pin && !released;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Pinning changes this section's height after mount, so let scroll trackers
  // further down the page re-measure their offsets.
  useEffect(() => {
    const id = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    return () => cancelAnimationFrame(id);
  }, [pinned]);

  // Autoplay only runs when scroll is not in control.
  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper?.autoplay) return;
    if (pinned) swiper.autoplay.stop();
    else swiper.autoplay.start();
  }, [pinned]);

  // Scroll steps through the concepts on the first pass only. After that the
  // carousel runs on its own and later scrolling leaves it alone.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!pinned || touredRef.current) return;
    const swiper = swiperRef.current;
    if (!swiper) return;
    const step = Math.min(
      concepts.length - 1,
      Math.floor((p / TOUR_SPAN) * concepts.length),
    );
    if (swiper.realIndex % concepts.length !== step) {
      swiper.slideToLoop(step, 700);
    }
    if (p >= 0.98) {
      touredRef.current = true;
      swiper.autoplay?.start();
    }
  });

  const openPreview = (index: number) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
    const opener = openerRef.current;
    openerRef.current = null;
    requestAnimationFrame(() => opener?.focus?.());
  };

  const current = concepts[active];

  const content = (
    <>
      <div className="gutter">
        <h2 className="font-grotesk text-4xl uppercase leading-tight md:text-5xl">
          Concepts
        </h2>
      </div>

      <div className="mt-12 md:mt-16">
        <ConceptCarousel
          concepts={concepts}
          onActiveChange={setActive}
          onOpen={openPreview}
          onSwiper={(s) => {
            swiperRef.current = s;
            if (pinned) s.autoplay?.stop();
          }}
        />
      </div>

      <div className="gutter mt-8 md:mt-10" aria-live="polite">
        {/* Name and category slip out and the next ones slip in on slide change */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.slug}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <h3 className="font-grotesk text-2xl leading-tight md:text-3xl">
              {current.name}
            </h3>
            <p className="mt-2 font-neue text-base leading-none md:text-lg">
              {current.category}
            </p>
          </motion.div>
        </AnimatePresence>
        <button
          type="button"
          onClick={() => openPreview(active)}
          className="mt-6 font-neue text-base leading-none underline underline-offset-4"
        >
          View concept
        </button>
      </div>
    </>
  );

  return (
    <>
      <section
        id="concepts"
        ref={sectionRef}
        className={cn("relative", !pinned && (pin ? "flex min-h-screen flex-col justify-center" : "section-gap"))}
        style={{ height: pinned ? `${(1 + TOUR_HOLD) * 100}vh` : undefined }}
      >
        <motion.div
          initial={pinned || reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "flex flex-col justify-center",
            pinned && "sticky top-0 h-screen",
          )}
        >
          {content}
        </motion.div>
      </section>

      <ConceptPreview
        concept={previewIndex === null ? null : concepts[previewIndex]}
        onClose={closePreview}
      />
    </>
  );
}
