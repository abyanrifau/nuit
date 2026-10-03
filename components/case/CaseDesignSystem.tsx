import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Work } from "@/data/work";

/** Readable text colour for a swatch label sitting on the swatch itself. */
/** Dark or light label text for a swatch: whichever contrasts more with it. */
function onColor(hex: string) {
  const luminance = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const L = luminance(hex);
  const ratio = (other: string) => {
    const o = luminance(other);
    return (Math.max(L, o) + 0.05) / (Math.min(L, o) + 0.05);
  };
  return ratio("#111111") >= ratio("#f4f4f2") ? "#111" : "#f4f4f2";
}

/*
 * A snapshot of the concept's design system: its typefaces (set in the
 * real fonts, captured from the live site), its palette, and a few of its
 * components as they appear on the page.
 */
export function CaseDesignSystem({ work: w }: { work: Work }) {
  const nav = w.components.find((c) => c.label === "Navigation");
  const rest = w.components.filter((c) => c !== nav);

  return (
    <section data-light="services" aria-labelledby="ds-title" className="px-site section-y">
      <SectionLabel index={4}>Design system</SectionLabel>
      <RevealText id="ds-title" className="mt-8 max-w-[16ch] text-h2">
        The pieces it&rsquo;s made from.
      </RevealText>

      {/* Type */}
      <div className="mt-[clamp(48px,9vh,112px)]">
        <h3 className="label text-muted">Type</h3>
        <Reveal className="mt-6 grid gap-4 md:grid-cols-2 md:gap-(--gutter)">
          {w.typefaces.map((t) => (
            <figure key={t.role} data-reveal-item className="rounded-(--radius-lg) border border-line bg-raised/60 p-6 md:p-8">
              <Image
                src={t.specimen}
                alt={`${t.family} ${t.style}: the letters A to Z, a to z and 0 to 9`}
                width={980}
                height={378}
                sizes="(min-width: 768px) 45vw, 90vw"
                className="h-auto w-full"
              />
              <figcaption className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line pt-5">
                <span className="font-display text-h4">{t.family}</span>
                <span className="text-small text-muted">
                  {t.role}, {t.style}. {t.usage}.
                </span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>

      {/* Colour */}
      <div className="mt-[clamp(48px,9vh,112px)]">
        <h3 className="label text-muted">Colour</h3>
        <Reveal as="ul" className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-5 md:gap-(--gutter)">
          {w.palette.map((s) => (
            <li key={s.hex} data-reveal-item>
              <div
                className="flex aspect-square flex-col justify-end rounded-(--radius-lg) border border-line p-4 md:aspect-[4/5]"
                style={{ background: s.hex, color: onColor(s.hex) }}
              >
                <span className="font-mono text-[12px] uppercase tracking-wider">{s.hex}</span>
              </div>
              <p className="mt-3 font-display">{s.name}</p>
              <p className="text-small text-muted">{s.role}</p>
            </li>
          ))}
        </Reveal>
      </div>

      {/* Components */}
      {w.components.length > 0 && (
        <div className="mt-[clamp(48px,9vh,112px)]">
          <h3 className="label text-muted">Components</h3>
          <Reveal className="mt-6 flex flex-col gap-4 md:gap-(--gutter)">
            {nav && (
              <figure data-reveal-item>
                <div className="overflow-hidden rounded-(--radius-lg) border border-line">
                  <Image
                    src={nav.file}
                    alt={`The ${w.name} navigation bar`}
                    width={nav.width}
                    height={nav.height}
                    sizes="100vw"
                    className="h-auto w-full"
                  />
                </div>
                <figcaption className="mt-3 text-small text-muted">{nav.label}</figcaption>
              </figure>
            )}
            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 md:gap-(--gutter)">
                {rest.map((c) => (
                  <figure key={c.label} data-reveal-item>
                    <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-(--radius-lg) border border-line bg-raised/60 p-6 md:min-h-[320px] md:p-12">
                      <Image
                        src={c.file}
                        alt={`A ${c.label.toLowerCase()} from the ${w.name} site`}
                        width={c.width}
                        height={c.height}
                        sizes="(min-width: 640px) 40vw, 80vw"
                        className="h-auto max-h-[560px] w-auto max-w-full rounded-md"
                      />
                    </div>
                    <figcaption className="mt-3 text-small text-muted">{c.label}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </Reveal>
        </div>
      )}
    </section>
  );
}
