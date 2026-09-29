"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePageSettled } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * A muted, looping scroll recording.
 *
 * Its first frame is shown straight away as a properly sized image (so a
 * phone never downloads the full-size frame), exactly where the video will
 * play. The video itself downloads only once it is near the screen AND the
 * page has finished loading (after the loading screen, when idle), so no
 * video data competes with the first view. It plays only while at least a
 * third of it is visible, and pauses the moment it leaves. With reduced
 * motion it stays on its first frame.
 */
export function WorkVideo({
  webm,
  mp4,
  poster,
  width,
  height,
  label,
  sizes = "100vw",
  decorative = false,
  className,
}: {
  webm: string;
  mp4: string;
  poster: string;
  width: number;
  height: number;
  label: string;
  /** How wide it shows, for choosing the poster size (as in next/image). */
  sizes?: string;
  /** Inside a link that already names the project: hide it from screen readers. */
  decorative?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useRef(false);
  const [near, setNear] = useState(false);
  const [reduced, setReduced] = useState(false);
  const settled = usePageSettled();
  const load = near && settled && !reduced;

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
    if (load && inView.current) ref.current?.play().catch(() => {});
  }, [load]);

  return (
    <div className="relative h-full w-full">
      <Image
        src={poster}
        alt=""
        fill
        sizes={sizes}
        className={cn("object-cover object-top", className)}
      />
      <video
        ref={ref}
        className={cn("relative block h-full w-full object-cover object-top", className)}
        width={width}
        height={height}
        muted
        loop
        playsInline
        preload={load ? "auto" : "none"}
        aria-label={decorative ? undefined : label}
        aria-hidden={decorative || undefined}
      >
        {load && (
          <>
            <source src={webm} type="video/webm" />
            <source src={mp4} type="video/mp4" />
          </>
        )}
      </video>
    </div>
  );
}
