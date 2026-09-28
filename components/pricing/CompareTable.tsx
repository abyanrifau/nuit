"use client";

import { useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/ui/icons";
import { comparison, packages, type Cell, type PackageId } from "@/data/pricing";
import { cn } from "@/lib/utils";

/** Included, not included (a faint mark, so the table reads calm rather than empty), or a detail. */
function Value({ value }: { value: Cell }) {
  if (value === true)
    return (
      <>
        <CheckIcon className="size-4" />
        <span className="sr-only">Included</span>
      </>
    );
  if (value === false)
    return (
      <>
        <span aria-hidden="true" className="block size-[5px] rounded-full bg-fg opacity-20" />
        <span className="sr-only">Not included</span>
      </>
    );
  return <span className="text-small">{value}</span>;
}

/** The popular package's column carries a very faint wash of light. */
const LIT = "bg-fg/[0.025]";

/*
 * "Compare packages": a toggle that opens a calm comparison of the three
 * website packages, grouped under small labels. On larger screens it is a
 * table with the popular package softly lit; on phones, a switcher shows one
 * package at a time instead of squeezing three columns.
 */
export function CompareTable() {
  const [open, setOpen] = useState(false);
  const [mobilePkg, setMobilePkg] = useState<PackageId>("business");

  return (
    <div className="border-y border-line">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="compare-table"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="font-display text-h4">Compare packages</span>
        <PlusIcon className={cn("size-5 transition-transform duration-500 ease-(--ease-out)", open && "rotate-45")} />
      </button>
      <div
        id="compare-table"
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-700 ease-(--ease-out)",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          {/* Tablet and desktop: the full table. */}
          <div className="hidden pb-8 md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">What each website package includes</caption>
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="label w-[34%] py-5 pr-4 font-normal text-muted">
                    Package
                  </th>
                  {packages.map((p) => (
                    <th
                      key={p.id}
                      scope="col"
                      className={cn("relative w-[22%] px-4 py-5 font-display text-h4 font-bold", p.popular && `compare-lit ${LIT}`)}
                    >
                      <span className="relative">{p.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              {comparison.map((group) => (
                <tbody key={group.group}>
                  <tr>
                    <th scope="rowgroup" colSpan={2} className="label pb-2 pt-8 font-normal text-muted">
                      {group.group}
                    </th>
                    {packages.slice(1).map((p) => (
                      <td key={p.id} className={cn(p.popular && LIT)} />
                    ))}
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.feature} className="border-b border-line">
                      <th scope="row" className="py-4 pr-4 font-normal">
                        {row.feature}
                      </th>
                      {packages.map((p) => (
                        <td key={p.id} className={cn("px-4 py-4", p.popular && LIT)}>
                          <Value value={row.cells[p.id]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>

          {/* Phones: one package at a time. */}
          <div className="pb-8 md:hidden">
            <div role="group" aria-label="Choose a package to see" className="flex gap-6 border-b border-line">
              {packages.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={mobilePkg === p.id}
                  onClick={() => setMobilePkg(p.id)}
                  className={cn(
                    "-mb-px border-b py-3 font-display transition-[color,border-color] duration-300",
                    mobilePkg === p.id ? "border-fg text-fg" : "border-transparent text-muted",
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <table className="mt-2 w-full border-collapse text-left" aria-live="polite">
              <caption className="sr-only">
                What {packages.find((p) => p.id === mobilePkg)?.name} includes
              </caption>
              {comparison.map((group) => (
                <tbody key={group.group}>
                  <tr>
                    <th scope="rowgroup" colSpan={2} className="label pb-1 pt-6 font-normal text-muted">
                      {group.group}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.feature} className="border-b border-line">
                      <th scope="row" className="py-3.5 pr-4 font-normal">
                        {row.feature}
                      </th>
                      <td className="w-[40%] py-3.5 text-right">
                        <span className="inline-flex justify-end">
                          <Value value={row.cells[mobilePkg]} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
