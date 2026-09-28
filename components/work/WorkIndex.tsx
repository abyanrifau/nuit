"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { ArrowIcon } from "@/components/ui/icons";
import { media, type Work } from "@/data/work";
import { gsap } from "@/lib/gsap";
import { useMedia } from "@/lib/hooks";
import { light } from "@/lib/light";
import { cn, pad2 } from "@/lib/utils";

/*
 * Every project as a large typographic list. On desktop, pointing at a row
 * brings up that project's recording in a small window that trails the
 * cursor, and the other rows step back. On touch screens it is a simple
 * stack of cards with thumbnails.
 */
export function WorkIndex({ items }: { items: Work[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [touched, setTouched] = useState<Set<number>>(() => new Set());
  const previewRef = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const activeRef = useRef<number | null>(null);
  const fine = useMedia("(hover: hover) and (pointer: fine)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");

  // The preview trails the pointer; the light follows it too.
  useEffect(() => {
    if (!fine) return;
    const el = previewRef.current!;
    const xTo = gsap.quickTo(el, "x", { duration: reduced ? 0.01 : 0.7, ease: "expo.out" });
    const yTo = gsap.quickTo(el, "y", { duration: reduced ? 0.01 : 0.7, ease: "expo.out" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      const a = activeRef.current;
      if (a !== null) light.focus(e.clientX / window.innerWidth, e.clientY / window.innerHeight, 0.4, items[a].light);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [fine, reduced, items]);

  useEffect(() => {
    activeRef.current = active;
    if (active === null) light.release();
    videos.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && !reduced) v.play().catch(() => {});
      else v.pause();
    });
  }, [active, reduced]);

  useEffect(() => () => light.release(), []);

  const activate = (i: number) => {
    setActive(i);
    setTouched((s) => (s.has(i) ? s : new Set(s).add(i)));
  };

  return (
    <>
      {/* Desktop and tablet: the typographic list. */}
      <ul className="hidden border-t border-line md:block" onPointerLeave={() => setActive(null)}>
        {items.map((w, i) => (
          <li key={w.slug} className="border-b border-line">
            <TransitionLink
              href={`/work/${w.slug}`}
              onPointerEnter={() => activate(i)}
              onFocus={() => activate(i)}
              onBlur={() => setActive(null)}
              className="grid-site items-center py-[clamp(20px,3.2vh,36px)]"
            >
              <span className="label col-span-1 tabular-nums text-muted">{pad2(i + 1)}</span>
              <span
                className={cn(
                  "col-span-6 font-display text-h2 transition-[opacity,translate] duration-500 ease-(--ease-out)",
                  active !== null && active !== i && "opacity-25",
                  active === i && "translate-x-4",
                )}
              >
                {w.name}
              </span>
              <span className="col-span-2 text-muted">{w.industry}</span>
              <span className="col-span-2">
                <span className="tag">{w.kind}</span>
              </span>
              <span className="col-span-1 flex items-center justify-end gap-3 tabular-nums text-muted">
                {w.year}
                <ArrowIcon className={cn("size-4 transition-opacity duration-300", active === i ? "opacity-100" : "opacity-0")} />
              </span>
            </TransitionLink>
          </li>
        ))}
      </ul>

      {/* Phones: stacked cards. */}
      <ul className="grid gap-12 md:hidden">
        {items.map((w, i) => {
          const m = media(w.slug);
          return (
            <li key={w.slug}>
              <TransitionLink href={`/work/${w.slug}`} className="block">
                <div className="overflow-hidden rounded-[14px] border border-line">
                  <Image
                    src={m.desktop.poster}
                    alt={`The ${w.name} homepage`}
                    width={m.desktop.width}
                    height={m.desktop.height}
                    sizes="100vw"
                    className="aspect-[16/10] w-full object-cover object-top"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <span className="font-display text-h3">{w.name}</span>
                  <span className="label tabular-nums text-muted">{pad2(i + 1)}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-small text-muted">
                  <span className="tag">{w.kind}</span>
                  <span>{w.industry}</span>
                  <span aria-hidden="true">·</span>
                  <span>{w.year}</span>
                </div>
              </TransitionLink>
            </li>
          );
        })}
      </ul>

      {/* The trailing preview window (desktop only). */}
      {fine && (
        <div ref={previewRef} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-30">
          <div
            className="relative aspect-[16/10] w-[min(30vw,460px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-raised shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] transition-[clip-path,opacity] duration-500 ease-(--ease-out)"
            style={{
              clipPath: active !== null ? "inset(0% round 12px)" : "inset(42% 42% round 12px)",
              opacity: active !== null ? 1 : 0,
            }}
          >
            {items.map((w, i) => {
              const m = media(w.slug).desktop;
              return (
                <video
                  key={w.slug}
                  ref={(el) => {
                    videos.current[i] = el;
                  }}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300",
                    i === active ? "opacity-100" : "opacity-0",
                  )}
                  poster={touched.has(i) ? m.poster : undefined}
                  muted
                  loop
                  playsInline
                  preload="none"
                >
                  {touched.has(i) && !reduced && (
                    <>
                      <source src={m.webm} type="video/webm" />
                      <source src={m.mp4} type="video/mp4" />
                    </>
                  )}
                </video>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
