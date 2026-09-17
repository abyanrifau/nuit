"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FadeUp } from "@/components/FadeUp";
import { faqs } from "@/data/faq";

/*
 * Collapsible questions. Unlike the pinned sections this one never holds the
 * scroll: rows simply rise in as they enter the viewport, and each answer
 * folds open on demand.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const reduced = useReducedMotion();

  return (
    <FadeUp id="faq" className="gutter section-gap">
      <h2 className="font-grotesk text-4xl uppercase leading-tight md:text-5xl">
        Questions
      </h2>

      <div className="mt-10 border-t border-black md:mt-12">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          const panelId = `faq-panel-${i}`;
          return (
            <motion.div
              key={f.question}
              className="border-b border-black"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.06 }}
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-start justify-between gap-6 py-5 text-left font-grotesk text-xl leading-tight md:py-6 md:text-2xl"
                >
                  <span>{f.question}</span>
                  {/* A plus that turns into a cross when open */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-[0.1em] inline-block font-neue text-2xl leading-none transition-transform duration-300 ease-out md:text-3xl",
                      isOpen && "rotate-45",
                    )}
                  >
                    +
                  </span>
                </button>
              </h3>
              {/* Always in the DOM so the answer text is crawlable; folded shut visually */}
              <motion.div
                id={panelId}
                aria-hidden={!isOpen}
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={reduced ? { duration: 0 } : { duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className="max-w-[40em] pb-6 font-neue text-base leading-relaxed md:pb-8 md:text-lg">
                  {f.answer}
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </FadeUp>
  );
}
