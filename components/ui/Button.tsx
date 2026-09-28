import type { ReactNode } from "react";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { ArrowIcon } from "@/components/ui/icons";
import { Magnetic } from "@/components/ui/Magnetic";
import { cn } from "@/lib/utils";

type Common = {
  children: string;
  href: string;
  className?: string;
  /** Opens in a new tab and skips the page transition. */
  external?: boolean;
  "aria-label"?: string;
  [data: `data-${string}`]: string | boolean | undefined;
};

/**
 * Primary button: white rounded rectangle, dark label. On hover the label
 * stays still; the white eases to a soft off-white, and the button leans a
 * few pixels toward the pointer.
 */
export function Button({
  children,
  href,
  className,
  external,
  size = "md",
  full = false,
  ...rest
}: Common & { size?: "sm" | "md"; full?: boolean }) {
  const cls = cn("btn", size === "sm" && "btn-sm", full && "w-full", className);
  return (
    <Magnetic className={full ? "w-full" : undefined}>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
          {children}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : (
        <TransitionLink href={href} className={cls} {...rest}>
          {children}
        </TransitionLink>
      )}
    </Magnetic>
  );
}

/** Secondary: an underlined text link, with an optional arrow. */
export function TextLink({
  children,
  href,
  className,
  external,
  arrow = false,
  ...rest
}: Omit<Common, "children"> & { children: ReactNode; arrow?: boolean }) {
  const cls = cn("link", className);
  const content = (
    <>
      {children}
      {arrow && <ArrowIcon className="arrow size-[0.9em]" />}
    </>
  );
  return external || href.startsWith("mailto:") ? (
    <a
      href={href}
      className={cls}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {content}
    </a>
  ) : (
    <TransitionLink href={href} className={cls} {...rest}>
      {content}
    </TransitionLink>
  );
}
