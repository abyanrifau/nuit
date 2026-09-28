import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import type { Work } from "@/data/work";
import { pad2 } from "@/lib/utils";

function Row({ index, label, children }: { index: number; label: string; children: ReactNode }) {
  return (
    <div className="grid-site gap-y-6 border-t border-line pt-8 md:pt-10">
      <p className="label col-span-12 flex gap-3 text-muted md:col-span-3">
        <span className="tabular-nums">{pad2(index)}</span>
        <span>{label}</span>
      </p>
      <div className="col-span-12 md:col-span-8 md:col-start-5">{children}</div>
    </div>
  );
}

/*
 * Brief, approach, result. What this kind of business needs, the design
 * decisions and why, and what was built. No invented numbers or quotes:
 * these are concepts, so the result is the build itself.
 */
export function CaseStory({ work: w }: { work: Work }) {
  return (
    <section data-light="page" aria-label="Brief, approach and result" className="px-site section-y flex flex-col gap-[clamp(64px,12vh,140px)]">
      <Row index={1} label="Brief">
        <RevealText as="p" className="max-w-[24ch] text-[clamp(1.375rem,0.95rem+2.1vw,3rem)] font-display leading-[1.1] tracking-[-0.025em]">
          {w.brief}
        </RevealText>
      </Row>

      <Row index={2} label="Approach">
        <Reveal as="ul" className="grid gap-x-(--gutter) gap-y-10 sm:grid-cols-2">
          {w.approach.map((a) => (
            <li key={a.title} data-reveal-item>
              <h3 className="text-h4">{a.title}</h3>
              <p className="mt-3 max-w-[30em] text-muted">{a.body}</p>
            </li>
          ))}
        </Reveal>
      </Row>

      <Row index={3} label="Result">
        <Reveal>
          <p className="max-w-[34em] text-lead">{w.result}</p>
        </Reveal>
        <Reveal as="ul" className="mt-10 border-t border-line">
          {w.built.map((b, i) => (
            <li key={b} data-reveal-item className="flex gap-6 border-b border-line py-4">
              <span className="label w-6 shrink-0 pt-1 tabular-nums text-muted">{pad2(i + 1)}</span>
              <span>{b}</span>
            </li>
          ))}
        </Reveal>
        {w.note && (
          <Reveal>
            <p className="mt-6 max-w-[38em] text-small text-muted">Note: {w.note}</p>
          </Reveal>
        )}
      </Row>
    </section>
  );
}
