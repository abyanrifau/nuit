"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** A media query as live state. False on the server. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True once the page has loaded and the main thread has had an idle moment. */
export function useAfterIdle(timeout = 1500) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const go = () => {
      if (typeof window.requestIdleCallback === "function") {
        idle = window.requestIdleCallback(() => setReady(true), { timeout });
      } else {
        timer = window.setTimeout(() => setReady(true), 200);
      }
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      if (timer) window.clearTimeout(timer);
    };
  }, [timeout]);
  return ready;
}

type NavigatorExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/**
 * Devices that should get still images instead of live WebGL: reduced
 * motion, data saver, or very little memory or CPU.
 */
export function isLowPowerDevice() {
  if (typeof window === "undefined") return true;
  const n = navigator as NavigatorExtras;
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    n.connection?.saveData === true ||
    (n.deviceMemory !== undefined && n.deviceMemory <= 2) ||
    (n.hardwareConcurrency !== undefined && n.hardwareConcurrency <= 2)
  );
}

const loaderLifted = () => document.documentElement.dataset.loader !== "play";
const onLoaderChange = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-loader"] });
  return () => mo.disconnect();
};

/**
 * True once the page has finished loading and gone idle, and the loading
 * screen (if it played) has lifted: the moment heavy, non-essential media
 * such as videos may start downloading without slowing the first view.
 */
export function usePageSettled() {
  const idle = useAfterIdle();
  const lifted = useSyncExternalStore(onLoaderChange, loaderLifted, () => false);
  return idle && lifted;
}
