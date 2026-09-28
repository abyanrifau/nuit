import { cn, pad2 } from "@/lib/utils";

/** "(02)  Selected concepts": the small index and name that opens a section. */
export function SectionLabel({ index, children, className }: { index?: number; children: string; className?: string }) {
  return (
    <p className={cn("label flex items-center gap-3 text-muted", className)}>
      {index !== undefined && <span className="tabular-nums">({pad2(index)})</span>}
      <span aria-hidden="true" className="h-px w-6 bg-line-strong" />
      <span>{children}</span>
    </p>
  );
}
