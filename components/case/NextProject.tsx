import { RevealText } from "@/components/motion/RevealText";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Button } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { BrowserFrame } from "@/components/work/Frames";
import { WorkVideo } from "@/components/work/WorkVideo";
import { hostOf, media, type Work } from "@/data/work";

/*
 * The end of a case study: one more chance to try the live site, then the
 * next project, large, with its recording already playing. The whole block
 * is one link that carries you into it through the page transition.
 */
export function NextProject({ current, next }: { current: Work; next: Work }) {
  const m = media(next.slug);
  return (
    <section data-light="cta" aria-label="Next project" className="px-site pb-(--section-y)">
      <div className="flex flex-col gap-6 border-y border-line py-10 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[22ch] font-display text-h3">See {current.name} for yourself.</p>
        <Button href={current.url} external>
          Visit live site
        </Button>
      </div>

      <TransitionLink
        href={`/work/${next.slug}`}
        className="group mt-[clamp(72px,14vh,160px)] block"
      >
        <p className="label text-muted">Next project</p>
        <div className="mt-8 grid-site items-end gap-y-10">
          <RevealText className="col-span-12 text-[clamp(3.75rem,12.5vw,15rem)] leading-[0.84] tracking-[-0.05em] transition-transform duration-700 ease-(--ease-out) group-hover:translate-x-3 md:col-span-7">
            {next.name}
          </RevealText>
          <div className="col-span-12 md:col-span-5">
            <BrowserFrame host={hostOf(next.url)}>
              <div className="aspect-[16/10] transition-transform duration-700 ease-(--ease-out) group-hover:scale-[1.035]">
                <WorkVideo {...m.desktop} sizes="(min-width: 768px) 40vw, 92vw" decorative label={next.name} />
              </div>
            </BrowserFrame>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between gap-6 border-t border-line pt-6 text-muted">
          <span className="flex items-center gap-3">
            <span className="tag">{next.kind}</span>
            {next.industry}
          </span>
          <span className="flex items-center gap-2 text-fg">
            View case study <ArrowIcon className="arrow size-4" />
          </span>
        </div>
      </TransitionLink>
    </section>
  );
}
