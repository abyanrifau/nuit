"use client";

import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { LazyMount } from "@/components/LazyMount";

// Swiper and the popup are only fetched once the section is near the viewport.
const ConceptCarousel = dynamic(
  () => import("@/components/ConceptCarousel").then((m) => m.ConceptCarousel),
  { ssr: false, loading: () => <CarouselSpace /> },
);
const ConceptPreview = dynamic(
  () => import("@/components/ConceptPreview").then((m) => m.ConceptPreview),
  { ssr: false },
);

/** Holds the carousel's exact height (one 16:9 slide plus the dots row). */
function CarouselSpace() {
  return (
    <div
      aria-hidden="true"
      className="h-[calc(min(78vw,300px)*9/16+30px)] md:h-[calc(min(40vw,820px)*9/16+30px)]"
    />
  );
}
import { concepts } from "@/data/concepts";

/*
 * Concepts. A normal scrolling section: the carousel runs on its own and the
 * page never holds here.
 */
export function Concepts() {
  const [active, setActive] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [everOpened, setEverOpened] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  const openPreview = (index: number) => {
    openerRef.current = document.activeElement as HTMLElement | null;
    setEverOpened(true);
    setPreviewIndex(index);
  };

  const closePreview = () => {
    setPreviewIndex(null);
    const opener = openerRef.current;
    openerRef.current = null;
    requestAnimationFrame(() => opener?.focus?.());
  };

  const current = concepts[active];

  return (
    <>
      <section id="concepts" className="section-pad">
        <m.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="gutter">
            <h2 className="font-grotesk text-4xl uppercase leading-tight md:text-5xl">
              Concepts
            </h2>
          </div>

          <div className="mt-12 md:mt-16">
            <LazyMount placeholder={<CarouselSpace />} margin="100px">
              <ConceptCarousel
                concepts={concepts}
                onActiveChange={setActive}
                onOpen={openPreview}
              />
            </LazyMount>
          </div>

          <div className="gutter mt-8 md:mt-10" aria-live="polite">
            {/* Name and category slip out and the next ones slip in on slide change */}
            <AnimatePresence mode="wait" initial={false}>
              <m.div
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
              </m.div>
            </AnimatePresence>
            <button
              type="button"
              onClick={() => openPreview(active)}
              className="mt-6 font-neue text-base leading-none underline underline-offset-4"
            >
              View concept
            </button>
          </div>
        </m.div>
      </section>

      {everOpened && (
        <ConceptPreview
          concept={previewIndex === null ? null : concepts[previewIndex]}
          onClose={closePreview}
        />
      )}
    </>
  );
}
