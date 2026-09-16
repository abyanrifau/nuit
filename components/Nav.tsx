"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { useScrollTo } from "@/components/SmoothScroll";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { label: "concepts", href: "#concepts" },
  { label: "services", href: "#services" },
  { label: "contact", href: "#contact" },
];

export function Nav() {
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const scrollTo = useScrollTo();
  const reduced = useReducedMotion();

  // Show the small wordmark only once the hero wordmark has scrolled out of view.
  useEffect(() => {
    const hero = document.getElementById("hero-wordmark");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setWordmarkVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpen(false);
    scrollTo(href);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-16 bg-white/70 backdrop-blur-md">
        <nav className="gutter flex h-full items-center justify-between">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setOpen(false);
              scrollTo(0);
            }}
            aria-hidden={!wordmarkVisible}
            tabIndex={wordmarkVisible ? 0 : -1}
            className={cn(
              "font-grotesk text-lg leading-none transition-opacity duration-500",
              wordmarkVisible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            Nuit Works.
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={go(l.href)}
                  className="font-grotesk text-base lowercase leading-none"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <ThemeToggle className="text-base" />
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="font-grotesk text-base lowercase leading-none md:hidden"
          >
            {open ? "close" : "menu"}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            data-lenis-prevent
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-white md:hidden"
          >
            <ul className="gutter flex h-full flex-col justify-center gap-6 pt-16">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={go(l.href)}
                    className="font-grotesk text-5xl lowercase leading-none"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li className="pt-4">
                <ThemeToggle className="text-2xl" />
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
