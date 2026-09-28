import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { TextLink } from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { packages } from "@/data/pricing";
import { cn } from "@/lib/utils";

/*
 * The three website packages with starting prices, and a line pointing to the
 * hosting and support plans; the full detail lives on /pricing.
 */
export function PricingPreview({ index = 6 }: { index?: number }) {
  return (
    <section data-light="pricing" aria-labelledby="pricing-title" className="px-site section-y">
      <div className="flex items-center justify-between gap-6">
        <SectionLabel index={index}>Pricing</SectionLabel>
        <TextLink href="/pricing" arrow className="text-small">
          Full pricing
        </TextLink>
      </div>
      <RevealText id="pricing-title" className="mt-8 max-w-[14ch] text-h2">
        Clear starting prices, quoted to fit.
      </RevealText>

      <Reveal as="ul" className="mt-[clamp(48px,8vh,96px)] grid gap-4 md:grid-cols-3 md:gap-(--gutter)">
        {packages.map((p) => (
          <li key={p.id} data-reveal-item>
            <TransitionLink
              href={`/pricing#${p.id}`}
              className={cn(
                "group flex h-full flex-col rounded-(--radius-lg) border bg-bg/40 p-7 backdrop-blur-sm transition-colors duration-500 md:p-8",
                p.popular ? "border-line-strong" : "border-line hover:border-line-strong",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-h4">{p.name}</h3>
                {p.popular && <span className="label text-muted">Most popular</span>}
              </div>
              <p className="label mt-10 text-muted">Starting from</p>
              <p className="mt-3 font-display text-[clamp(2rem,1.5rem+1.6vw,3rem)] leading-none tracking-[-0.03em]">
                {p.price}
              </p>
              <p className="mt-6 flex-1 text-muted">{p.goodFor}</p>
              <span className="mt-8 flex items-center gap-2 text-small">
                See what&rsquo;s included
                <ArrowIcon className="arrow size-3.5" />
              </span>
            </TransitionLink>
          </li>
        ))}
      </Reveal>
      <Reveal>
        <p className="mt-8 text-muted">
          <TextLink href="/pricing#hosting">Hosting and support plans from MVR 300/month.</TextLink>
        </p>
      </Reveal>
    </section>
  );
}
