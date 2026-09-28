"use client";

import { useState } from "react";
import { RevealText } from "@/components/motion/RevealText";
import { TextLink } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Service } from "@/data/studio";
import { useMedia } from "@/lib/hooks";
import { cn, pad2 } from "@/lib/utils";

/*
 * Services as a large typographic list. On desktop, pointing at a row opens
 * its line of detail on the right and the other rows step back. On touch,
 * a tap opens it underneath. Every row is a real disclosure button, so the
 * keyboard and screen readers get the same thing.
 */
export function ServicesList({ items, index = 4 }: { items: Service[]; index?: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const fine = useMedia("(hover: hover) and (pointer: fine)");

  return (
    <section data-light="services" aria-labelledby="services-title" className="px-site section-y">
      <div className="flex items-center justify-between gap-6">
        <SectionLabel index={index}>Services</SectionLabel>
        <TextLink href="/services" arrow className="text-small">
          All services
        </TextLink>
      </div>
      <RevealText id="services-title" className="mt-8 max-w-[14ch] text-h2">
        Everything your website needs, from design to hosting.
      </RevealText>

      <ul className="mt-[clamp(48px,8vh,96px)] border-t border-line" onPointerLeave={() => fine && setOpen(null)}>
        {items.map((s, i) => {
          const isOpen = open === i;
          const dim = open !== null && !isOpen;
          const id = `service-${i}`;
          return (
            <li key={s.name} className="border-b border-line">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onPointerEnter={() => fine && setOpen(i)}
                onClick={() => setOpen(fine ? i : isOpen ? null : i)}
                className="grid-site w-full items-center py-6 text-left md:py-[clamp(24px,3.4vh,40px)]"
              >
                <span className="label col-span-2 tabular-nums text-muted md:col-span-1">{pad2(i + 1)}</span>
                <span
                  className={cn(
                    "col-span-9 font-display text-h3 transition-[opacity,translate] duration-500 ease-(--ease-out) md:col-span-6",
                    dim && "opacity-30",
                    isOpen && "md:translate-x-3",
                  )}
                >
                  {s.name}
                </span>
                <span className="col-span-1 justify-self-end md:col-start-12 md:row-start-1">
                  <PlusIcon
                    className={cn(
                      "size-5 transition-transform duration-500 ease-(--ease-out)",
                      isOpen && "rotate-45",
                    )}
                  />
                </span>
                <span
                  id={id}
                  className={cn(
                    "col-span-12 grid transition-[grid-template-rows,opacity,translate] duration-500 ease-(--ease-out)",
                    "md:col-span-4 md:col-start-8 md:row-start-1 md:grid-rows-[1fr]",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 md:translate-y-2",
                  )}
                >
                  <span className="overflow-hidden">
                    <span className="block pt-3 text-muted md:pt-0">{s.short}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
