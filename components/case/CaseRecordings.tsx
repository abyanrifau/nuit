import { Reveal } from "@/components/motion/Reveal";
import { BrowserFrame, PhoneFrame } from "@/components/work/Frames";
import { WorkVideo } from "@/components/work/WorkVideo";
import { hostOf, media, type Work } from "@/data/work";

/** The site in motion: desktop in a browser window, mobile in a phone, staggered. */
export function CaseRecordings({ work: w }: { work: Work }) {
  const m = media(w.slug);
  return (
    <section data-light="work" aria-label={`${w.name} in motion`} className="px-site grid-site gap-y-10">
      <Reveal className="col-span-12 md:col-span-9" y={40}>
        <BrowserFrame host={hostOf(w.url)}>
          <div className="aspect-[16/10]">
            <WorkVideo {...m.desktop} sizes="(min-width: 768px) 72vw, 92vw" label={`${w.name} on a desktop, scrolling from top to bottom`} />
          </div>
        </BrowserFrame>
      </Reveal>
      <Reveal
        className="col-span-8 col-start-3 md:col-span-3 md:col-start-10 md:mt-[18vh]"
        y={60}
        delay={0.1}
      >
        <PhoneFrame>
          <div className="aspect-[600/1298]">
            <WorkVideo {...m.mobile} sizes="(min-width: 768px) 22vw, 62vw" label={`${w.name} on a phone, scrolling from top to bottom`} />
          </div>
        </PhoneFrame>
      </Reveal>
    </section>
  );
}
