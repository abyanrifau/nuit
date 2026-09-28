import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A quiet browser window: three dots, the address, then the page. */
export function BrowserFrame({
  host,
  children,
  className,
}: {
  host: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-line bg-raised shadow-[0_40px_120px_-40px_rgb(0_0_0/0.8)]",
        className,
      )}
    >
      <div className="flex h-9 items-center gap-4 border-b border-line px-4" aria-hidden="true">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </div>
        <div className="mx-auto flex h-5 min-w-0 max-w-[60%] flex-1 items-center justify-center rounded-md bg-white/[0.06] px-3 text-[11px] leading-none text-muted">
          <span className="truncate">{host}</span>
        </div>
        <div className="w-[42px]" />
      </div>
      <div className="relative overflow-hidden">{children}</div>
    </div>
  );
}

/** A phone: rounded body, a slim notch, the page inside. */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[34px] border border-line bg-raised p-[7px] shadow-[0_40px_120px_-40px_rgb(0_0_0/0.8)]",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[28px]">
        {children}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2 h-[18px] w-[30%] -translate-x-1/2 rounded-full bg-black"
        />
      </div>
    </div>
  );
}
