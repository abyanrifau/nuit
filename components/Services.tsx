"use client";

import { PinnedSection, Reveal } from "@/components/PinnedSection";

const services = [
  {
    name: "Custom design",
    description:
      "Every website is designed from the ground up around your brand, your audience, and the way your customers use it. No templates.",
  },
  {
    name: "Development and launch",
    description:
      "We build your site to be fast and fully responsive on every device, test it thoroughly, and take it live.",
  },
  {
    name: "Hosting and support",
    description:
      "Once your site is live, we host and maintain it, and make updates whenever your business needs them.",
  },
  {
    name: "Unlimited revisions",
    description:
      "Once we begin working together, we refine the design until you are completely satisfied, with no limit on revisions.",
  },
];

export function Services() {
  return (
    <PinnedSection id="services" hold={1}>
      {(progress) => (
        <>
          <Reveal progress={progress} range={[0.35, 0.5]}>
            <h2 className="font-grotesk text-4xl uppercase leading-tight md:text-5xl">
              What we offer
            </h2>
          </Reveal>

          <ul className="mt-12 border-t border-black md:mt-16">
            {services.map((s, i) => (
              <Reveal
                key={s.name}
                progress={progress}
                range={[0.45 + i * 0.08, 0.6 + i * 0.08]}
              >
                <li className="grid grid-cols-1 gap-3 border-b border-black py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12 md:py-8">
                  <h3 className="font-grotesk text-xl leading-tight md:text-2xl">
                    {s.name}
                  </h3>
                  <p className="max-w-[40em] font-neue text-base leading-relaxed md:text-lg">
                    {s.description}
                  </p>
                </li>
              </Reveal>
            ))}
          </ul>
        </>
      )}
    </PinnedSection>
  );
}
