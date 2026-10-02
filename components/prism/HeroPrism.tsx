"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MOUSE_QUERY, mouseFrame, REACH, touchFrame, type PrismFrame } from "@/components/prism/prism-frame";
import { gsap, useGSAP } from "@/lib/gsap";
import { isLowPowerDevice, useAfterIdle, useMedia, usePageSettled } from "@/lib/hooks";

// The shader is fetched and started only after first paint and an idle
// moment; until then a pre-rendered frame of the same prism holds its place.
const Prism = dynamic(() => import("@/components/prism/Prism"), { ssr: false });

/** How long the still frame takes to hand over to the live prism (the fades below). */
const HANDOVER_MS = 120 + 700;

/** Lets the loading screen know the hero's prism is fully drawn. */
function announceReady() {
  const html = document.documentElement;
  if ("heroReady" in html.dataset) return;
  html.dataset.heroReady = "";
  window.dispatchEvent(new Event("nw:hero-ready"));
}

/**
 * The prism behind the hero, laid out as on the previous site.
 *
 * With a mouse, it tilts toward the cursor and sits to the right of centre
 * at every window width, at its original size, and as the hero scrolls away
 * it turns and fades, so its light sweeps as you leave.
 *
 * On touch screens (phones and tablets) it is huge, soft and centred,
 * filling the hero behind the heading and fading out toward the bottom of
 * the hero, and it moves only by itself, as the previous site's did: a slow
 * tumble on its own clock (the "3drotate" mode at a time scale of 0.22),
 * starting once the loading screen lifts. Touch, scrolling and tilting the
 * phone do not affect it.
 *
 * Which one follows the pointer (hover and a fine pointer), not the
 * window's width, and switches if that changes. It tells the loading screen
 * once it is fully drawn (the live prism after its hand-over, or the still
 * frame where that is all the loading screen waits for).
 *
 * Reduced motion, data saver and low-power devices keep the still frame.
 */
export function HeroPrism() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mouse = useMedia(MOUSE_QUERY);
  const idle = useAfterIdle();
  const settled = usePageSettled();
  const [allowed, setAllowed] = useState(false);
  const [live, setLive] = useState(false);
  const [frame, setFrame] = useState<PrismFrame | null>(null);
  const turn = useMemo(() => ({ value: 0 } as { value: number; kick?: () => void }), []);

  // Place the prism for this layout, and again whenever the layout moves.
  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const measure = () => {
      // clientWidth and clientHeight ignore the scroll transform on the host,
      // so this is always the resting layout.
      const width = host.clientWidth;
      const height = host.clientHeight;
      const next = window.matchMedia(MOUSE_QUERY).matches ? mouseFrame(width, height) : touchFrame(width, height);
      setFrame((prev) =>
        prev && Math.abs(prev.cx - next.cx) < 0.5 && Math.abs(prev.cy - next.cy) < 0.5 && Math.abs(prev.unit - next.unit) < 0.05
          ? prev
          : next,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    const pointer = window.matchMedia(MOUSE_QUERY);
    pointer.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      pointer.removeEventListener("change", measure);
    };
  }, []);

  // Where the live prism does not start during page load (low-power
  // devices, and touch screens, which start it once the loading screen has
  // lifted), the still frame is what the loading screen waits for: ready
  // once its image has loaded and decoded.
  useEffect(() => {
    if (!frame || (!isLowPowerDevice() && window.matchMedia(MOUSE_QUERY).matches)) return;
    const img = new Image();
    img.src = window.matchMedia("(min-width: 768px)").matches ? "/hero-poster-desktop.webp" : "/hero-poster-mobile.webp";
    img.decode().then(announceReady, announceReady);
  }, [frame]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- device checks only exist on the client
    if (!isLowPowerDevice()) setAllowed(true);
  }, []);

  // Scroll (mouse devices only): turn the prism and let the whole glow sink
  // back and fade. On touch screens the prism ignores scrolling.
  useGSAP(
    () => {
      const host = hostRef.current;
      const hero = host?.closest("section");
      if (!host || !hero) return;
      const mm = gsap.matchMedia();
      mm.add(MOUSE_QUERY, () => {
        gsap.to(host, {
          yPercent: 18,
          opacity: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              turn.value = self.progress;
              turn.kick?.();
            },
          },
        });
      });
      return () => mm.revert();
    },
    { scope: hostRef },
  );

  // Mouse: as soon as the page is idle. Touch: once the loading screen has
  // lifted too, so it starts moving as the hero comes into view.
  const mount = allowed && (mouse ? idle : settled);
  const reach = frame ? REACH * frame.unit : 0;

  return (
    // On touch screens this fades out toward the bottom of the hero (globals.css).
    <div ref={hostRef} aria-hidden="true" className="hero-prism pointer-events-none absolute inset-0 -z-10">
      {/* The still frame: the same prism on a transparent square, placed exactly where the live one draws. */}
      {frame && (
        <div
          className="hero-poster absolute transition-opacity duration-700 ease-out"
          style={{
            left: frame.cx - reach,
            top: frame.cy - reach,
            width: reach * 2,
            height: reach * 2,
            opacity: live ? 0 : 1,
          }}
        />
      )}
      {mount && frame && (
        <div className="absolute inset-0 transition-opacity duration-700 ease-out" style={{ opacity: live ? 1 : 0 }}>
          <Prism
            animationType={mouse ? "hover" : "3drotate"}
            timeScale={mouse ? 0.5 : 0.22}
            height={3.5}
            baseWidth={4.3}
            frame={frame}
            fitHeight={!mouse}
            hueShift={-0.0416}
            colorFrequency={1.75}
            noise={0}
            glow={1}
            suspendWhenOffscreen
            renderScale={mouse ? 0.5 : 0.4}
            turn={mouse ? turn : undefined}
            onReady={() => {
              window.setTimeout(() => setLive(true), 120);
              window.setTimeout(announceReady, HANDOVER_MS);
            }}
          />
        </div>
      )}
    </div>
  );
}
