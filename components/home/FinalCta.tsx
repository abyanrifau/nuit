"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { RevealText } from "@/components/motion/RevealText";
import type { Progress } from "@/components/prism/PrismRefraction";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ScrollTrigger } from "@/lib/gsap";
import { isLowPowerDevice } from "@/lib/hooks";
import { CONTACT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";

// Only fetched when a page actually shows the prism (the home page).
const PrismRefraction = dynamic(() => import("@/components/prism/PrismRefraction").then((m) => m.PrismRefraction), {
  ssr: false,
});

/** Marks the word "project" so the prism can sit level with it. */
function withLevel(title: string): ReactNode {
  const i = title.indexOf("project");
  if (i < 0) return title;
  return (
    <>
      {title.slice(0, i)}
      <span data-prism-level>project</span>
      {title.slice(i + "project".length)}
    </>
  );
}

/*
 * The last word before the footer. The light gathers here (the "cta" mood).
 * On the home page the prism returns too: a shaft of light enters from the
 * top right, bends through the glass and lands as a spectrum on the button,
 * scrubbing with the scroll as the section arrives. Every other page keeps
 * the same section with only the soft background light, and never loads
 * the prism at all.
 */
export function FinalCta({
  title = "Have a project in mind?",
  body = "Tell us about your business and what you want to build. We'll get back to you to talk through the details and next steps.",
  prism = false,
}: {
  title?: string;
  body?: string;
  /** Show the prism and its light (home page only). */
  prism?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const progress = useMemo<Progress>(() => ({ value: 0 }), []);
  const [near, setNear] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!prism) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- device checks only exist on the client
    setAllowed(!isLowPowerDevice());
    const el = panelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px" });
    io.observe(el);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      end: "center 55%",
      onUpdate: (self) => (progress.value = self.progress),
      onRefresh: (self) => (progress.value = self.progress),
    });
    return () => {
      io.disconnect();
      st.kill();
    };
  }, [prism, progress]);

  const showPrism = prism && near && allowed;

  return (
    <section data-light="cta" aria-labelledby="cta-title" className="section-y relative">
      <div ref={panelRef} className="px-site relative">
        {showPrism && <PrismRefraction progress={progress} />}
        {/* A faint shadow under the copy keeps it crisp where the light passes behind. */}
        <div className={cn("relative z-10", prism && "[text-shadow:0_1px_18px_rgb(11_11_12/0.6)]")}>
          <SectionLabel>Start a project</SectionLabel>
          <RevealText id="cta-title" className="mt-8 max-w-[11ch] text-h1">
            {prism ? withLevel(title) : title}
          </RevealText>
          <Reveal className="mt-10 max-w-[30em]">
            <p className="text-lead">{body}</p>
          </Reveal>
          <Reveal className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-5">
            <Button href="/contact" data-prism-target>
              Start a project
            </Button>
            <a href={`mailto:${CONTACT_EMAIL}`} className="link">
              {CONTACT_EMAIL}
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
