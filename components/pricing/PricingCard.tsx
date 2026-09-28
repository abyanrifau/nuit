"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Button, TextLink } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { timelineNote, type Package } from "@/data/pricing";
import { media, type Work } from "@/data/work";
import { contactHref } from "@/lib/contact";
import { gsap } from "@/lib/gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * A website package, presented like an object you can pick up: on desktop it
 * tilts a few degrees toward the pointer, a soft glare follows the pointer
 * across it, and its edge catches a faint prism spectrum that turns with the
 * pointer's angle. The most popular package sits in a slightly stronger pool
 * of soft light. Touch and reduced motion get the card, still.
 */
export function PricingCard({ pkg, example }: { pkg: Package; example?: Work }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const card = cardRef.current!;
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const opts = { duration: 0.9, ease: "expo.out" };
    const rx = gsap.quickTo(card, "rotationX", opts);
    const ry = gsap.quickTo(card, "rotationY", opts);
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 7);
      rx(-(py - 0.5) * 7);
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      card.style.setProperty("--angle", `${Math.atan2(py - 0.5, px - 0.5) + Math.PI / 2}rad`);
    };
    const leave = () => {
      rx(0);
      ry(0);
    };
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);
    return () => {
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={wrapRef} id={pkg.id} className="relative isolate scroll-mt-32 [perspective:1400px]">
      {pkg.popular && <span aria-hidden="true" className="pcard-pool" />}
      <article
        ref={cardRef}
        aria-labelledby={`${pkg.id}-name`}
        className={cn(
          "pcard group relative flex h-full flex-col rounded-[22px] border bg-raised/80 p-7 md:p-9",
          pkg.popular ? "border-line-strong" : "border-line",
        )}
      >
        <span aria-hidden="true" className="pcard-edge" />
        <span aria-hidden="true" className="pcard-glare" />

        <header className="flex items-baseline justify-between gap-4">
          <h3 id={`${pkg.id}-name`} className="text-h3">
            {pkg.name}
          </h3>
          {pkg.popular && <span className="label text-muted">Most popular</span>}
        </header>

        <p className="label mt-10 text-muted">Starting from</p>
        <p className="mt-3 font-display text-[clamp(2.5rem,1.8rem+2.2vw,3.75rem)] leading-none tracking-[-0.035em]">
          {pkg.price}
        </p>
        <p className="mt-3 text-small text-muted">Final price quoted based on project size.</p>

        <div className="mt-8 border-t border-line pt-6">
          <p className="label text-muted">Who it&rsquo;s for</p>
          <p className="mt-2 text-lead">{pkg.goodFor}</p>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <p className="label text-muted">What&rsquo;s included</p>
          <ul className="mt-3 flex flex-col gap-2.5">
            {pkg.includes.map((f) => (
              <li key={f} className="flex gap-3">
                <CheckIcon className="mt-[0.3em] size-4 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {pkg.note && <p className="mt-4 text-small text-muted">{pkg.note}</p>}
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <p>
            <span className="text-muted">Typical timeline: </span>
            {pkg.timeline}
          </p>
          <p className="mt-1 text-small text-muted">{timelineNote}</p>
        </div>

        {example && (
          <div className="mt-8 flex gap-4 rounded-(--radius) border border-line bg-bg/50 p-3">
            <div className="w-28 shrink-0 overflow-hidden rounded-md border border-line">
              <Image
                src={media(example.slug).desktop.poster}
                alt=""
                width={1280}
                height={800}
                sizes="112px"
                className="aspect-[16/10] w-full object-cover object-top"
              />
            </div>
            <div className="min-w-0 text-small">
              <p className="text-muted">{pkg.example.note}</p>
              <TextLink href={`/work/${example.slug}`} arrow className="mt-2">
                {`View ${example.name}`}
              </TextLink>
            </div>
          </div>
        )}

        <div className="mt-auto pt-10">
          <Button href={contactHref(pkg.id)} full aria-label={`Get a quote for ${pkg.name}`}>
            Get a quote
          </Button>
        </div>
      </article>
    </div>
  );
}
