import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

/**
 * The opening of every inner page: a small label, a large title set in
 * explicit lines that slide up from behind masks, and an optional intro.
 * CSS-driven, so it plays on first paint and waits under a transition.
 */
export function PageHero({
  eyebrow,
  lines,
  intro,
  children,
  className,
}: {
  eyebrow: string;
  lines: string[];
  intro?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-light="page"
      className={cn("px-site grid-site pb-[clamp(64px,12vh,140px)] pt-[calc(var(--header-h)+clamp(72px,16vh,180px))]", className)}
    >
      <p className="label enter-fade col-span-12 text-muted">{eyebrow}</p>
      <h1 className="col-span-12 mt-6 text-h1 md:mt-8">
        {lines.map((line, i) => (
          <span key={line} className="block">
            <span className="enter-blur block" style={delay(0.05 + i * 0.08)}>
              {line}
            </span>
          </span>
        ))}
      </h1>
      {intro && (
        <div
          className="enter-fade col-span-12 mt-10 max-w-[34em] text-lead text-muted md:col-span-7 md:col-start-6 md:mt-14"
          style={delay(0.25 + lines.length * 0.05)}
        >
          {intro}
        </div>
      )}
      {children}
    </section>
  );
}

export { delay as enterDelay };
