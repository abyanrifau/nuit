"use client";

import Link, { type LinkProps } from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent } from "react";
import { usePageTransition } from "./TransitionProvider";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<LinkProps, "href"> & { href: string };

/**
 * A next/link that fades the page out before changing page (see TransitionProvider).
 * Modified clicks (new tab, new window) and external links behave normally.
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, onClick, target, ...rest },
  ref,
) {
  const { navigate } = usePageTransition();

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (target && target !== "_self") return;
    if (/^(https?:|mailto:|tel:)/.test(href) && !href.startsWith(window.location.origin)) return;
    e.preventDefault();
    navigate(href);
  };

  return <Link ref={ref} href={href} target={target} onClick={handle} {...rest} />;
});
