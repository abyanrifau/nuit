import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SHOW_TEAM, team } from "@/data/team";

/**
 * PLACEHOLDER: the people behind the studio. Renders nothing until
 * data/team.ts has entries and SHOW_TEAM is true, so no names, photos or
 * bios are ever invented.
 */
export function TeamSection({ index }: { index?: number }) {
  if (!SHOW_TEAM || team.length === 0) return null;

  return (
    <section data-light="intro" aria-labelledby="team-title" className="px-site section-y">
      <SectionLabel index={index}>The team</SectionLabel>
      <RevealText id="team-title" className="mt-8 max-w-[14ch] text-h2">
        The team.
      </RevealText>
      <Reveal as="ul" className="mt-[clamp(48px,8vh,96px)] grid gap-(--gutter) md:grid-cols-2">
        {team.map((m) => (
          <li key={m.name} data-reveal-item>
            {m.photo && (
              <div className="overflow-hidden rounded-(--radius-lg) border border-line">
                <Image
                  src={m.photo}
                  alt={m.name}
                  width={1200}
                  height={1500}
                  sizes="(min-width: 768px) 45vw, 90vw"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            )}
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <h3 className="text-h3">{m.name}</h3>
              <p className="label text-muted">{m.role}</p>
            </div>
            <p className="mt-3 max-w-[32em] text-muted">{m.bio}</p>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
