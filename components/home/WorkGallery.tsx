"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import { RevealText } from "@/components/motion/RevealText";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { ArrowIcon } from "@/components/ui/icons";
import { ProjectCard } from "@/components/work/ProjectCard";
import type { Work } from "@/data/work";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cn, pad2 } from "@/lib/utils";

const PIN_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/*
 * The signature section. On a desktop with a mouse the gallery pins and the
 * work slides sideways as you scroll down, with a thin bar showing where you
 * are. Everywhere else (touch, small screens, reduced motion) it is a plain
 * horizontal row you swipe, with snap points and no scroll-jacking.
 */
export function WorkGallery({ items }: { items: Work[] }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const [pinned, setPinned] = useState(false);
  const { scrollTo } = useSmoothScroll();
  const total = items.length;

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const update = () => setPinned(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const setProgress = (p: number) => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${Math.max(0.001, p)})`;
    if (counterRef.current) counterRef.current.textContent = pad2(Math.min(total, Math.floor(p * total * 0.999) + 1));
  };

  // Desktop: pin and translate the track sideways.
  useGSAP(
    () => {
      if (!pinned) return;
      const track = trackRef.current!;
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => setProgress(self.progress),
        },
      });
      // This pin is created after the sections below it (it waits to know
      // the pointer type), so re-order and re-measure everything after it.
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    },
    { dependencies: [pinned], revertOnUpdate: true },
  );

  // Touch and small screens: a native swipe row; the bar follows it.
  useEffect(() => {
    if (pinned) return;
    const track = trackRef.current!;
    const onScroll = () => setProgress(track.scrollLeft / Math.max(1, track.scrollWidth - track.clientWidth));
    onScroll();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned]);

  // Keyboard: tabbing to a card that is off to the side scrolls it into view.
  const onFocus = (e: FocusEvent<HTMLAnchorElement>) => {
    if (!pinned) return;
    const pin = pinRef.current!;
    const track = trackRef.current!;
    const card = e.currentTarget.closest("li")!;
    const distance = track.scrollWidth - window.innerWidth;
    const pinTop = pin.parentElement!.getBoundingClientRect().top + window.scrollY;
    const x = Math.min(distance, Math.max(0, card.offsetLeft - (window.innerWidth - card.offsetWidth) / 2));
    scrollTo(pinTop + x, { duration: 0.9 });
  };


  return (
    <section id="work" data-light="work" aria-labelledby="work-title" className="relative pt-(--section-y)">
      <div className="px-site grid-site items-end gap-y-8">
        <div className="col-span-12 md:col-span-8">
          <p className="label flex items-center gap-3 text-muted">
            <span className="tabular-nums">(02)</span>
            <span aria-hidden="true" className="h-px w-6 bg-line-strong" />
            <span>Selected concepts</span>
          </p>
          <RevealText id="work-title" className="mt-8 max-w-[14ch] text-h2">
            Sites we designed to show what&rsquo;s possible.
          </RevealText>
        </div>
        <div className="col-span-12 md:col-span-4 md:justify-self-end md:text-right">
          <p className="max-w-[26em] text-muted md:ml-auto">
            Six concept sites for the kinds of businesses we work with. Each one is a concept we
            made ourselves, not a client project.
          </p>
        </div>
      </div>

      <div ref={pinRef} className={cn("relative", pinned && "flex h-svh flex-col justify-center pt-(--header-h)")}>
        <ul
          ref={trackRef}
          className={cn(
            // Positioned, so screen-reader-only text inside stays within the row.
            "relative flex gap-[clamp(20px,3.2vw,56px)] px-(--pad-x)",
            pinned
              ? "w-max will-change-transform"
              : "mt-12 snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          style={pinned ? undefined : { scrollPaddingInline: "var(--pad-x)" }}
        >
          {items.map((w, i) => (
            <li key={w.slug} className="shrink-0 snap-start">
              <ProjectCard
                work={w}
                index={i}
                total={total}
                onFocus={onFocus}
                className="w-[68vw] md:w-[72vw] lg:w-[min(64vw,calc((100svh-300px)*1.6))]"
              />
            </li>
          ))}

          <li className="shrink-0 snap-start">
            <TransitionLink
              href="/work"
              onFocus={onFocus}
              className="group flex h-full w-[68vw] flex-col justify-between rounded-[22px] border border-line p-7 transition-colors duration-500 hover:border-line-strong md:w-[44vw] md:p-10 lg:w-[min(34vw,calc((100svh-300px)*0.9))]"
            >
              <span className="label text-muted">Index</span>
              <span>
                <span className="block font-display text-h2">View all work</span>
                <span className="mt-6 flex items-center gap-3 text-muted">
                  {total} concepts, with case studies
                  <ArrowIcon className="arrow size-4" />
                </span>
              </span>
            </TransitionLink>
          </li>
        </ul>

        <div className="px-site mt-8 flex items-center gap-5 lg:mt-10">
          <span className="label tabular-nums text-muted">
            <span ref={counterRef}>01</span> / {pad2(total)}
          </span>
          <span className="relative h-px flex-1 overflow-hidden bg-line" aria-hidden="true">
            <span
              ref={barRef}
              className="absolute inset-0 origin-left bg-fg"
              style={{ transform: "scaleX(0.001)" }}
            />
          </span>
          <span className="label text-muted lg:hidden">Swipe</span>
        </div>
      </div>
    </section>
  );
}
