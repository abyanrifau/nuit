"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLenis } from "@/components/SmoothScroll";
import { previewImages, type Concept } from "@/data/concepts";

type ConceptPreviewProps = {
  concept: Concept | null;
  onClose: () => void;
};

export function ConceptPreview({ concept, onClose }: ConceptPreviewProps) {
  const { lenis } = useLenis();
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = concept !== null;

  // Lock page scroll (and Lenis) while open, close on Escape, focus the close button.
  useEffect(() => {
    if (!open) return;

    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
    };
  }, [open, lenis, onClose]);

  return (
    <AnimatePresence>
      {concept && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${concept.name} preview`}
          data-lenis-prevent
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-white"
          onClick={onClose}
        >
          <div
            className="gutter mx-auto w-full py-8 md:py-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <h2 className="font-grotesk text-3xl leading-tight md:text-4xl">
                  {concept.name}
                </h2>
                <p className="mt-2 font-neue text-base leading-none md:text-lg">
                  {concept.category}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="font-grotesk text-base lowercase leading-none outline-none focus:outline-none focus-visible:underline focus-visible:underline-offset-4"
              >
                close
              </button>
            </div>

            <div className="mt-12 flex flex-col gap-12 md:mt-16 md:gap-24">
              {previewImages(concept).map((src, i) => (
                <Image
                  key={src}
                  src={src}
                  alt={`${concept.name} ${concept.category.toLowerCase()} website concept, ${["top", "middle", "lower"][i]} section of the homepage on desktop`}
                  width={1440}
                  height={900}
                  sizes="(min-width: 768px) 88vw, 100vw"
                  className="h-auto w-full"
                      quality={90}
                />
              ))}
            </div>

            <a
              href={concept.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 inline-block font-neue text-base leading-none underline underline-offset-4 md:mt-16"
            >
              Visit full site
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
