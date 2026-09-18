"use client";

import Link from "next/link";
import { m, useReducedMotion } from "framer-motion";

/*
 * 404. A bare page: no nav, carousel or footer. The rest of the site's chrome
 * is hidden by CSS whenever this page is present (see globals.css).
 */
export function NotFound() {
  const reduced = useReducedMotion();

  return (
    <section
      data-not-found
      className="gutter flex min-h-screen flex-col justify-center"
      // Painted on the page itself so there is never a flash or a strip of
      // another colour, whatever the viewport height.
      style={{ background: "var(--bg)", color: "var(--fg)" }}
    >
      <m.div
        initial={reduced ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <p className="font-neue text-[13px] leading-none">Error 404</p>
        <h1 className="mt-6 font-grotesk text-[clamp(2.5rem,8vw,6rem)] leading-[0.95] tracking-[-0.03em]">
          Page not found.
        </h1>
        <p className="mt-8 max-w-[24em] font-neue text-xl leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="btn-outline no-dim mt-10 inline-block px-8 py-4 font-grotesk text-base leading-none"
        >
          Back to home
        </Link>
      </m.div>
    </section>
  );
}
