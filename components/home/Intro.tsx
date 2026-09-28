import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { TextLink } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";

/*
 * What we do, in one sentence, revealed line by line. Then who we are, in
 * a short paragraph set off to the right.
 */
export function Intro() {
  return (
    <section data-light="intro" aria-labelledby="intro-title" className="px-site section-y grid-site">
      <SectionLabel index={1} className="col-span-12 md:col-span-2">
        Who we are
      </SectionLabel>

      <RevealText
        id="intro-title"
        className="col-span-12 mt-8 text-h2 md:col-span-10 md:mt-0 md:max-w-[15ch]"
      >
        We design and build websites for businesses, then look after them for you.
      </RevealText>

      <Reveal className="col-span-12 mt-12 md:col-span-5 md:col-start-8 md:mt-20">
        <p className="text-lead text-muted">
          Nuit Works is a web design and development studio in the Maldives. We take care of
          everything, from the first idea to launch and the support that follows. We also take on
          projects from abroad.
        </p>
        <TextLink href="/about" arrow className="mt-8">
          About the studio
        </TextLink>
      </Reveal>
    </section>
  );
}
