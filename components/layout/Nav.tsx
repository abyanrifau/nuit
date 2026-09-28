"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/providers/SmoothScroll";
import { TransitionLink } from "@/components/transition/TransitionLink";
import { Magnetic } from "@/components/ui/Magnetic";
import { gsap } from "@/lib/gsap";
import { EASE_SOFT, EASE_SWAP, prefersReducedMotion } from "@/lib/motion";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL, NAV_LINKS } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * The header, as on the previous site: the small wordmark on the left and
 * plain lowercase links on the right, bold and white, with no bar behind
 * them. A soft shadow on the text keeps it legible over lighter backgrounds.
 * Pointing at a link softly dims the others and the link leans a few pixels
 * toward the pointer; a small dot sits under the current page's link and
 * glides to the new one when you change page. The header tucks
 * away while scrolling down a long page and returns on the way back up. On
 * the home page the wordmark only appears once the giant hero wordmark has
 * left the screen.
 */

const SHADOW = "[text-shadow:0_0_14px_rgb(11_11_12/0.45)]";

/**
 * The nav link for the page you are on, read straight from the route: /work
 * and every case study under it are "work", each other section is itself,
 * and the home page (or anything else) has none. Query strings, like a
 * package picked for the contact form, don't matter.
 */
function activeHref(pathname: string): string | null {
  return NAV_LINKS.find((l) => pathname === l.href || pathname.startsWith(`${l.href}/`))?.href ?? null;
}

export function Nav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  // Whether the home page's giant wordmark is on screen, for the page it was measured on.
  const [heroMark, setHeroMark] = useState<{ path: string; visible: boolean }>({ path: "", visible: false });
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  // Close the menu whenever the route changes.
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // Hide after 60% of a screen when heading down; show again on the way up.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const read = () => {
      ticking = false;
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > window.innerHeight * 0.6);
        lastY = y;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(read);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Home only: watch the hero wordmark.
  useEffect(() => {
    const mark = document.getElementById("hero-wordmark");
    if (!mark) return;
    const io = new IntersectionObserver(([e]) => setHeroMark({ path: pathname, visible: e.isIntersecting }), {
      threshold: 0,
    });
    io.observe(mark);
    return () => io.disconnect();
  }, [pathname]);

  const active = activeHref(pathname);
  const showMark = !(heroMark.path === pathname && heroMark.visible);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-transform duration-700 ease-(--ease-out)",
          hidden && !open && "-translate-y-full",
        )}
      >
        <nav aria-label="Main" className="px-site flex h-(--header-h) items-center justify-between">
          <TransitionLink
            href="/"
            aria-label="Nuit Works, home"
            tabIndex={showMark || open ? 0 : -1}
            className={cn(
              "font-display text-lg leading-none transition-opacity duration-500",
              SHADOW,
              showMark || open ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            Nuit Works.
          </TransitionLink>

          <DesktopLinks active={active} />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={cn("relative -mr-3 px-3 py-3 font-display text-base lowercase leading-none md:hidden", SHADOW)}
          >
            {/* The two words crossfade in place. */}
            <span aria-hidden="true" className="inline-grid">
              <span className={cn("col-start-1 row-start-1 transition-opacity duration-300", open && "opacity-0")}>
                menu
              </span>
              <span className={cn("col-start-1 row-start-1 transition-opacity duration-300", !open && "opacity-0")}>
                close
              </span>
            </span>
          </button>
        </nav>
      </header>

      <MobileMenu open={open} onClose={() => setOpen(false)} active={active} />
    </>
  );
}

/** The link row, with one dot that glides to whichever link is current. */
function DesktopLinks({ active }: { active: string | null }) {
  const listRef = useRef<HTMLUListElement>(null);
  const dotRef = useRef<HTMLLIElement>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const list = listRef.current;
    const dot = dotRef.current;
    if (!list || !dot) return;
    const place = (glide: boolean) => {
      // Measured on the list item, never the link: the link sits inside the
      // magnetic wrapper, whose transform would make it the link's offset
      // parent and throw the position off.
      const current = active ? list.querySelector<HTMLElement>(`li[data-href="${active}"]`) : null;
      // The first placement and resizes jump; page changes glide.
      dot.style.transition = glide
        ? "transform 0.6s var(--ease-soft), opacity 0.4s var(--ease-soft)"
        : "opacity 0.4s var(--ease-soft)";
      dot.style.opacity = current ? "1" : "0";
      if (current) {
        dot.style.transform = `translateX(${current.offsetLeft + current.offsetWidth / 2}px) translateX(-50%)`;
      }
    };
    place(placed.current);
    placed.current = true;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(list);
    document.fonts?.ready.then(() => place(false));
    return () => ro.disconnect();
  }, [active]);

  return (
    <ul ref={listRef} className="nav-links relative hidden items-center gap-8 md:flex">
      {NAV_LINKS.map((l) => (
        <li key={l.href} data-href={l.href}>
          <Magnetic>
            <TransitionLink
              href={l.href}
              aria-current={active === l.href ? "page" : undefined}
              className={cn("block py-2 font-display text-base lowercase leading-none", SHADOW)}
            >
              {l.label}
            </TransitionLink>
          </Magnetic>
        </li>
      ))}
      <li
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-1.5 left-0 size-[5px] rounded-full bg-fg opacity-0"
      />
    </ul>
  );
}

function MobileMenu({
  open,
  onClose,
  active,
}: {
  open: boolean;
  onClose: () => void;
  active: string | null;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { stop, start } = useSmoothScroll();
  const wasOpen = useRef(false);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const reduced = prefersReducedMotion();
    const items = panel.querySelectorAll("[data-menu-item]");

    if (open) {
      wasOpen.current = true;
      stop();
      document.documentElement.style.overflow = "hidden";
      const tl = gsap.timeline();
      tl.set(panel, { visibility: "visible" });
      if (reduced) {
        tl.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      } else {
        tl.fromTo(panel, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: EASE_SWAP })
          // The same clean fade the headings use: clear and slightly blurred to sharp.
          .fromTo(
            items,
            { opacity: 0, filter: "blur(7px)" },
            { opacity: 1, filter: "blur(0px)", duration: 0.9, ease: EASE_SOFT, stagger: 0.08, clearProps: "filter" },
            "-=0.3",
          );
      }
      const first = panel.querySelector<HTMLElement>("a");
      const t = window.setTimeout(() => first?.focus(), reduced ? 50 : 500);
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", onKey);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("keydown", onKey);
        tl.kill();
      };
    }

    if (!wasOpen.current) return;
    wasOpen.current = false;
    document.documentElement.style.overflow = "";
    start();
    const tl = gsap.timeline({ onComplete: () => void gsap.set(panel, { visibility: "hidden" }) });
    if (reduced) tl.to(panel, { opacity: 0, duration: 0.2 });
    else tl.to(panel, { clipPath: "inset(0 0 100% 0)", duration: 0.55, ease: EASE_SWAP });
    return () => {
      tl.progress(1).kill();
    };
    // onClose, start and stop are stable enough; re-running on their identity would replay the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div
      id="mobile-menu"
      ref={panelRef}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
      inert={!open}
      className="invisible fixed inset-0 z-40 flex flex-col bg-bg md:hidden"
      style={{ clipPath: "inset(0 0 100% 0)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60vh 40vh at 90% 100%, rgb(148 104 66 / 0.28), transparent 70%), radial-gradient(50vh 40vh at 0% 80%, rgb(43 102 148 / 0.24), transparent 70%)",
        }}
      />
      <nav aria-label="Menu" className="px-site relative flex flex-1 flex-col justify-center pt-(--header-h)">
        <ul className="flex flex-col gap-5">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <TransitionLink
                href={l.href}
                data-menu-item
                aria-current={active === l.href ? "page" : undefined}
                className="inline-flex items-center gap-4 font-display text-[clamp(2.75rem,13vw,4rem)] lowercase leading-none"
              >
                {l.label}
                {active === l.href && <span aria-hidden="true" className="size-[5px] rounded-full bg-fg" />}
              </TransitionLink>
            </li>
          ))}
        </ul>
      </nav>
      <div data-menu-item className="px-site relative flex justify-between pb-10 text-small text-muted">
        <a href={`mailto:${CONTACT_EMAIL}`} className="link">
          {CONTACT_EMAIL}
        </a>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="link">
          {INSTAGRAM_HANDLE}
        </a>
      </div>
    </div>
  );
}
