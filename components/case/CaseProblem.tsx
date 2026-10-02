import { RevealText } from "@/components/motion/RevealText";
import type { Work } from "@/data/work";

/*
 * The point of the project in two sentences, straight after the hero: the
 * problem this kind of business has, and the standout feature built to
 * solve it. Two columns on wider screens, stacked on phones.
 */
export function CaseProblem({ work: w }: { work: Work }) {
  const items = [
    { id: "problem", label: "The problem", text: w.problem },
    { id: "usp", label: "What we added", text: w.usp },
  ];
  return (
    <section
      data-light="page"
      aria-label="The problem and what we added"
      className="px-site grid-site gap-y-12 pb-[clamp(64px,12vh,140px)]"
    >
      {items.map((item, i) => (
        <div key={item.id} className={i === 0 ? "col-span-12 md:col-span-6 md:pr-[4%]" : "col-span-12 md:col-span-6 md:pl-[4%]"}>
          <h2 id={`case-${item.id}`} className="label border-t border-line pt-6 text-muted">
            {item.label}
          </h2>
          <RevealText
            as="p"
            delay={i * 0.08}
            className="mt-6 max-w-[30ch] font-display text-[clamp(1.5rem,1rem+1.6vw,2.625rem)] leading-[1.12] tracking-[-0.025em]"
          >
            {item.text}
          </RevealText>
        </div>
      ))}
    </section>
  );
}
