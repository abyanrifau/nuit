"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A muted, looping scroll recording. Nothing downloads until it is near the
 * screen; it plays only while at least a third of it is visible, and pauses
 * the moment it leaves. With reduced motion it stays on its poster.
 */
export function WorkVideo({
  webm,
  mp4,
  poster,
  width,
  height,
  label,
  decorative = false,
  className,
}: {
  webm: string;
  mp4: string;
  poster: string;
  width: number;
  height: number;
  label: string;
  /** Inside a link that already names the project: hide it from screen readers. */
  decorative?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useRef(false);
  const [near, setNear] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(rm);

    // Start loading a little before it arrives.
    const nearIo = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          nearIo.disconnect();
        }
      },
      { rootMargin: "50% 50%" },
    );
    nearIo.observe(video);

    const playIo = new IntersectionObserver(
      ([e]) => {
        inView.current = e.isIntersecting;
        if (rm) return;
        if (e.isIntersecting && !document.hidden) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
    );
    playIo.observe(video);
    return () => {
      nearIo.disconnect();
      playIo.disconnect();
    };
  }, []);

  // Sources arrive after the first play attempt; start once they are in.
  useEffect(() => {
    if (near && !reduced && inView.current) ref.current?.play().catch(() => {});
  }, [near, reduced]);

  return (
    <video
      ref={ref}
      className={cn("block h-full w-full object-cover object-top", className)}
      width={width}
      height={height}
      // Browsers fetch posters eagerly, so it is only attached once the
      // video is close; until then the frame shows its background.
      poster={near ? poster : undefined}
      muted
      loop
      playsInline
      preload={near && !reduced ? "auto" : "none"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      {near && !reduced && (
        <>
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
        </>
      )}
    </video>
  );
}
