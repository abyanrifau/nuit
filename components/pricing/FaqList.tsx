"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import type { Faq } from "@/data/faq";
import { cn, pad2 } from "@/lib/utils";

/** Questions and answers as a smooth accordion. Any number can be open. */
export function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <ul className="border-t border-line">
      {items.map((f, i) => {
        const isOpen = open.has(i);
        return (
          <li key={f.question} className="border-b border-line">
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => toggle(i)}
                className="grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-6 text-left md:grid-cols-[4rem_1fr_auto]"
              >
                <span className="label tabular-nums text-muted">{pad2(i + 1)}</span>
                <span className="font-display text-h4">{f.question}</span>
                <PlusIcon
                  className={cn(
                    "size-5 self-center transition-transform duration-500 ease-(--ease-out)",
                    isOpen && "rotate-45",
                  )}
                />
              </button>
            </h3>
            <div
              id={`faq-a-${i}`}
              role="region"
              aria-labelledby={`faq-q-${i}`}
              inert={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-600 ease-(--ease-out)",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="max-w-[40em] pb-7 pl-[calc(2.5rem+1rem)] text-muted md:pl-[calc(4rem+1rem)]">{f.answer}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
