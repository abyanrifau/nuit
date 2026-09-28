import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { planIncludes, planNote, plans } from "@/data/pricing";
import { contactHref } from "@/lib/contact";

/*
 * Hosting and support: monthly plans, kept in their own section (and in
 * smaller, quieter cards) so nobody mistakes them for the website packages.
 */
export function HostingPlans() {
  return (
    <section id="hosting" data-light="services" aria-labelledby="hosting-title" className="px-site section-y scroll-mt-24">
      <div className="grid-site gap-y-8">
        <div className="col-span-12 md:col-span-6">
          <SectionLabel>After launch</SectionLabel>
          <RevealText id="hosting-title" className="mt-8 max-w-[12ch] text-h2">
            Hosting and support.
          </RevealText>
        </div>
        <Reveal className="col-span-12 md:col-span-5 md:col-start-8 md:self-end">
          <p className="text-lead text-muted">
            Once your site is live, we host it and look after it, so you never have to deal with
            the tech.
          </p>
          <p className="mt-4 text-small text-muted">
            Monthly plans, separate from the website packages above.
          </p>
        </Reveal>
      </div>

      <Reveal as="ul" className="mt-[clamp(48px,8vh,96px)] grid gap-4 md:grid-cols-2 md:gap-(--gutter)">
        {plans.map((plan) => (
          <li key={plan.id} data-reveal-item id={plan.id} className="scroll-mt-32">
            <article
              aria-labelledby={`${plan.id}-name`}
              className="flex h-full flex-col rounded-(--radius-lg) border border-line p-6 md:p-8"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 id={`${plan.id}-name`} className="text-h4">
                  {plan.name}
                </h3>
                <p className="font-display text-h4">
                  {plan.price}
                  <span className="text-small text-muted">{plan.per}</span>
                </p>
              </div>

              <p className="label mt-6 text-muted">{plan.adds ? "Everything in Standard, plus" : "Includes"}</p>
              <ul className="mt-3 flex flex-col gap-2 text-small">
                {(plan.adds ?? planIncludes).map((f) => (
                  <li key={f} className="flex gap-3">
                    <CheckIcon className="mt-[0.25em] size-3.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Button href={contactHref(plan.id)} size="sm" aria-label={`Choose ${plan.name} hosting`}>
                  {`Choose ${plan.name}`}
                </Button>
              </div>
            </article>
          </li>
        ))}
      </Reveal>
      <Reveal>
        <p className="mt-6 text-small text-muted">{planNote}</p>
      </Reveal>
    </section>
  );
}
