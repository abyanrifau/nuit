"use client";

import type { FocusEvent } from "react";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { BrowserFrame } from "@/components/work/Frames";
import { WorkVideo } from "@/components/work/WorkVideo";
import { hostOf, media, type Work } from "@/data/work";
import { light } from "@/lib/light";
import { cn, pad2 } from "@/lib/utils";

/**
 * One project in the gallery: its index, its Concept or Client tag, the
 * scroll recording (the phone version on phones, the desktop one in a
 * browser window elsewhere), then its name and industry. Pointing at it
 * grows the cursor, scales the recording a touch, and draws the
 * page's light toward it. The whole card links to the case study.
 */
export function ProjectCard({
  work: w,
  index,
  total,
  onFocus,
  className,
}: {
  work: Work;
  index: number;
  total: number;
  onFocus?: (e: FocusEvent<HTMLAnchorElement>) => void;
  className?: string;
}) {
  const m = media(w.slug);
  return (
    <TransitionLink
      href={`/work/${w.slug}`}
      onFocus={onFocus}
      onPointerEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        light.focus((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight, 0.42, w.light);
      }}
      onPointerLeave={() => light.release()}
      className={cn("group block", className)}
    >
      <div className="label mb-4 flex items-center justify-between text-muted">
        <span className="tabular-nums">
          {pad2(index + 1)} / {pad2(total)}
        </span>
        <span className="tag">{w.kind}</span>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-line bg-raised md:hidden">
        <div className="aspect-[600/1298] transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.03]">
          <WorkVideo {...m.mobile} decorative label={`${w.name} on a phone`} />
        </div>
      </div>
      <BrowserFrame host={hostOf(w.url)} className="max-md:hidden">
        <div className="aspect-[16/10] transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.035]">
          <WorkVideo {...m.desktop} decorative label={`${w.name} on a desktop`} />
        </div>
      </BrowserFrame>

      <div className="mt-5 flex items-baseline justify-between gap-6">
        <h3 className="text-h3">{w.name}</h3>
        <p className="shrink-0 text-small text-muted">{w.industry}</p>
      </div>
      <span className="sr-only">View the case study</span>
    </TransitionLink>
  );
}
