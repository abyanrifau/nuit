"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { forwardRef, useRef, type AnchorHTMLAttributes, type FocusEvent, type MouseEvent, type PointerEvent, type TouchEvent } from "react";
import { usePageTransition } from "./TransitionProvider";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<LinkProps, "href"> & { href: string };

/**
 * A next/link that fades the page out before changing page (see TransitionProvider).
 * Modified clicks (new tab, new window) and external links behave normally.
 *
 * The next page is prefetched on intent (pointer over it, a touch or keyboard
 * focus) rather than as soon as the link scrolls into view, so opening a
 * page never downloads the data for every link on it; the 250ms fade-out
 * gives any late prefetch time to land.
 */
export const TransitionLink = forwardRef<HTMLAnchorElement, Props>(function TransitionLink(
  { href, onClick, onPointerEnter, onTouchStart, onFocus, target, ...rest },
  ref,
) {
  const { navigate } = usePageTransition();
  const router = useRouter();
  const prefetched = useRef(false);

  const prefetch = () => {
    if (prefetched.current || !href.startsWith("/") || (target && target !== "_self")) return;
    prefetched.current = true;
    router.prefetch(href);
  };

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (target && target !== "_self") return;
    if (/^(https?:|mailto:|tel:)/.test(href) && !href.startsWith(window.location.origin)) return;
    e.preventDefault();
    navigate(href);
  };

  return (
    <Link
      ref={ref}
      href={href}
      target={target}
      prefetch={false}
      onClick={handle}
      onPointerEnter={(e: PointerEvent<HTMLAnchorElement>) => {
        onPointerEnter?.(e);
        prefetch();
      }}
      onTouchStart={(e: TouchEvent<HTMLAnchorElement>) => {
        onTouchStart?.(e);
        prefetch();
      }}
      onFocus={(e: FocusEvent<HTMLAnchorElement>) => {
        onFocus?.(e);
        prefetch();
      }}
      {...rest}
    />
  );
});
