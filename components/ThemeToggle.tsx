"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";
const STORAGE_KEY = "nuit-works-theme";

type DocumentWithTransition = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage unavailable; the choice just won't persist.
  }
}

/**
 * Switches between light and dark with a circular reveal from the click point.
 * Uses the View Transitions API where available, otherwise a short colour fade.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doc = document as DocumentWithTransition;

    if (reduced) {
      applyTheme(next);
      return;
    }

    if (doc.startViewTransition) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      // Radius to the farthest viewport corner, so the circle ends exactly as
      // it covers the screen and the motion reads as one continuous sweep.
      const w = window.innerWidth;
      const h = window.innerHeight;
      const r = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
      html.style.setProperty("--theme-x", `${x}px`);
      html.style.setProperty("--theme-y", `${y}px`);
      html.style.setProperty("--theme-r", `${Math.ceil(r)}px`);
      doc.startViewTransition(() => applyTheme(next));
      return;
    }

    html.classList.add("theme-fade");
    applyTheme(next);
    window.setTimeout(() => html.classList.remove("theme-fade"), 600);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn("font-grotesk lowercase leading-none", className)}
    >
      {theme === "dark" ? "light" : "dark"}
    </button>
  );
}
