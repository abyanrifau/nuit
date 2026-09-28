"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { RevealText } from "@/components/motion/RevealText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Work } from "@/data/work";
import { pad2 } from "@/lib/utils";

/*
 * The key pages side by side, full width. Swipe on touch; on desktop, drag
 * with the mouse (the cursor says so) or scroll sideways with a trackpad.
 * Keyboard users can focus the strip and use the arrow keys.
 */
export function PageStrip({ work: w }: { work: Work }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current!;
    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.style.scrollSnapType = "none";
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      el.style.scrollSnapType = "";
    };
    // A drag should not count as a click on anything inside.
    const onClick = (e: MouseEvent) => {
      if (moved) e.preventDefault();
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <section data-light="page" aria-labelledby="pages-title" className="pb-(--section-y)">
      <div className="px-site flex items-end justify-between gap-6">
        <div>
          <SectionLabel index={5}>Pages</SectionLabel>
          <RevealText id="pages-title" className="mt-8 text-h3">
            Key pages
          </RevealText>
        </div>
        <p className="label text-muted">Drag</p>
      </div>
      <div
        ref={ref}
        tabIndex={0}
        role="region"
        aria-label={`${w.name} key pages, scrollable`}
        className="mt-10 flex snap-x snap-mandatory gap-(--gutter) overflow-x-auto px-(--pad-x) pb-4 [scrollbar-width:none] select-none [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingInline: "var(--pad-x)" }}
      >
        {w.pages.map((p, i) => (
          <figure key={p.file} className="w-[82vw] shrink-0 snap-start md:w-[58vw]">
            <div className="overflow-hidden rounded-[14px] border border-line">
              <Image
                src={p.file}
                alt={`The ${w.name} ${p.label} page`}
                width={p.width}
                height={p.height}
                sizes="(min-width: 768px) 58vw, 82vw"
                draggable={false}
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-4 flex gap-4 text-small">
              <span className="label pt-0.5 tabular-nums text-muted">{pad2(i + 1)}</span>
              {p.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
