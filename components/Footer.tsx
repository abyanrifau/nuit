"use client";

import { useScrollTo } from "@/components/SmoothScroll";

const links = [
  { label: "concepts", href: "#concepts" },
  { label: "services", href: "#services" },
  { label: "contact", href: "#contact" },
];

const contacts = [
  {
    label: "Email",
    text: "hello@nuit.works",
    href: "mailto:hello@nuit.works",
    external: false,
  },
  {
    label: "Instagram",
    text: "@nuit.works",
    href: "https://instagram.com/nuit.works",
    external: true,
  },
];

export function Footer() {
  const scrollTo = useScrollTo();

  return (
        // Extra bottom padding equal to the page-edge blur keeps the last line clear of it.
    <footer className="gutter pt-[var(--section-pad)] pb-[calc(3rem+6rem)] md:pb-[calc(4rem+6rem)]">
      <div className="flex flex-col gap-12 md:flex-row md:items-stretch md:justify-between md:gap-16">
        {/* Primary contact points: large, left */}
        <ul className="flex flex-col gap-3 md:gap-4">
          {contacts.map((c) => (
            <li key={c.href}>
              <a
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                aria-label={c.label}
                className="inline-block font-grotesk text-[clamp(2.25rem,6vw,5.5rem)] leading-none tracking-[-0.03em] underline decoration-2 underline-offset-[0.1em] decoration-transparent transition-[text-decoration-color] duration-200 hover:decoration-black focus-visible:decoration-black focus-visible:outline-none"
              >
                {c.text}
              </a>
            </li>
          ))}
        </ul>

        {/* Sitemap, right */}
        <ul className="flex flex-col gap-2 md:justify-between md:gap-0 md:items-end md:text-right">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(l.href);
                }}
                className="font-grotesk text-lg lowercase leading-none md:text-xl"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-12 font-neue text-sm leading-relaxed md:text-base">
        © 2026 Nuit Works
      </p>
    </footer>
  );
}
