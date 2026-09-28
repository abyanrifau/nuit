import type { CSSProperties } from "react";
import { enterDelay } from "@/components/layout/PageHero";
import { Button, TextLink } from "@/components/ui/Button";
import type { Work } from "@/data/work";

/** The case study opening: the name at full size, what it is, and a way to try it. */
export function CaseHero({ work: w }: { work: Work }) {
  return (
    <section
      data-light="page"
      className="px-site grid-site gap-y-10 pb-[clamp(56px,10vh,120px)] pt-[calc(var(--header-h)+clamp(48px,10vh,120px))]"
    >
      <div className="enter-fade col-span-12 flex flex-wrap items-center justify-between gap-4">
        <TextLink href="/work" className="text-small text-muted">
          <span aria-hidden="true">&larr;</span> All work
        </TextLink>
        <p className="label flex flex-wrap items-center gap-x-3 gap-y-2 text-muted">
          <span className="tag">{w.kind}</span>
          <span>{w.industry}</span>
          <span aria-hidden="true">/</span>
          <span>{w.location}</span>
          <span aria-hidden="true">/</span>
          <span className="tabular-nums">{w.year}</span>
        </p>
      </div>

      <h1 className="col-span-12 -ml-[0.04em] text-[clamp(4.25rem,15.5vw,19rem)] leading-[0.84] tracking-[-0.05em]">
        <span className="block">
          <span className="enter-blur block" style={enterDelay(0.05)}>
            {w.name}
          </span>
        </span>
      </h1>

      <div className="enter-fade col-span-12 md:col-span-7" style={enterDelay(0.2) as CSSProperties}>
        <p className="max-w-[26em] text-lead">{w.summary}</p>
      </div>
      <div
        className="enter-fade col-span-12 flex flex-col items-start gap-3 md:col-span-4 md:col-start-9 md:items-end md:self-end"
        style={enterDelay(0.28)}
      >
        <Button href={w.url} external>
          Visit live site
        </Button>
        <p className="text-small text-muted">
          A {w.kind.toLowerCase()} site, live and working.
        </p>
      </div>
    </section>
  );
}
