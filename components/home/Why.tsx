import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { pillars } from "@/data/studio";
import { cn, pad2 } from "@/lib/utils";

/*
 * Two reasons, stated big, set on opposite sides of the page.
 */
export function Why({ index = 3 }: { index?: number }) {
  return (
    <section data-light="why" aria-labelledby="why-title" className="px-site section-y">
      <SectionLabel index={index}>Why Nuit Works</SectionLabel>
      <h2 id="why-title" className="sr-only">
        Why Nuit Works
      </h2>

      {pillars.map((p, i) => {
        const flip = i % 2 === 1;
        return (
          <article
            key={p.label}
            className="grid-site mt-[clamp(56px,11vh,140px)] items-end gap-y-8 first-of-type:mt-[clamp(40px,7vh,80px)]"
          >
            <div className={cn("col-span-12 md:col-span-8", flip && "md:col-start-5 md:text-right")}>
              <p className={cn("label flex items-center gap-3 text-muted", flip && "md:justify-end")}>
                <span className="tabular-nums">{pad2(i + 1)}</span>
                <span>{p.label}</span>
              </p>
              <RevealText
                as="h3"
                className={cn(
                  "mt-6 text-[clamp(2.75rem,1.2rem+5.8vw,8.25rem)] leading-[0.92] tracking-[-0.045em]",
                  flip && "md:ml-auto",
                  "max-w-[11ch]",
                )}
              >
                {p.statement}
              </RevealText>
            </div>
            <Reveal
              className={cn(
                "col-span-12 md:col-span-4 md:pb-3",
                flip ? "md:col-start-1 md:row-start-1" : "md:col-start-9",
              )}
            >
              <p className="max-w-[24em] text-lead text-muted">{p.body}</p>
            </Reveal>
          </article>
        );
      })}
    </section>
  );
}
