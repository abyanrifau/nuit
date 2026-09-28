"use client";

import type { ReactNode } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { ArrowIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** An in-page link that glides to its target with the site's smooth scroll. */
export function ScrollLink({
  href,
  children,
  className,
  arrow = false,
}: {
  href: `#${string}`;
  children: ReactNode;
  className?: string;
  arrow?: boolean;
}) {
  const { scrollTo } = useSmoothScroll();
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        scrollTo(href, { duration: 1.6 });
        history.replaceState(null, "", href);
      }}
      className={cn("link", className)}
    >
      {children}
      {arrow && <ArrowIcon className="arrow size-[0.9em] rotate-90" />}
    </a>
  );
}
