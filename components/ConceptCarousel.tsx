"use client";

import { m, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/effect-coverflow";

import { cn } from "@/lib/utils";
import { slideImage, type Concept } from "@/data/concepts";

/*
 * Carousel adapted from Skiper UI Carousel_003 (https://skiper-ui.com).
 * Built with Swiper.js.
 *
 * Swiper's loop mode needs more slides than fit on screen, so the six
 * concepts are rendered twice and the real index is mapped back with a modulo.
 */

const css = `
  .concept-carousel {
    width: 100%;
    height: auto;
    background: var(--bg);
  }
  .concept-carousel .swiper-wrapper {
    align-items: center;
  }
  /* 16:9 slides that scale with the viewport, so the centred one stays large on big screens */
  .concept-carousel .swiper-slide {
    width: min(78vw, 300px);
    aspect-ratio: 16 / 9;
    height: auto;
    background: var(--bg);
  }
  @media (min-width: 768px) {
    .concept-carousel .swiper-slide {
      width: min(40vw, 820px);
    }
  }
`;

type ConceptCarouselProps = {
  concepts: Concept[];
  onActiveChange: (index: number) => void;
  onOpen: (index: number) => void;
  /** Receives the Swiper instance so a parent can drive it (e.g. from scroll). */
  onSwiper?: (swiper: SwiperType) => void;
};

export function ConceptCarousel({
  concepts,
  onActiveChange,
  onOpen,
  onSwiper,
}: ConceptCarouselProps) {
  const reduced = useReducedMotion();
  const swiperRef = useRef<SwiperType | null>(null);
  const [active, setActive] = useState(0);
  const count = concepts.length;
  const slides = [...concepts, ...concepts];

  const setActiveFrom = (swiper: SwiperType) => {
    const index = swiper.realIndex % count;
    setActive(index);
    onActiveChange(index);
  };

  const handleClick = (swiper: SwiperType) => {
    const slide = swiper.clickedSlide as HTMLElement | undefined;
    if (!slide) return;
    const realIndex = Number(slide.dataset.swiperSlideIndex ?? swiper.clickedIndex);
    if (swiper.clickedIndex === swiper.activeIndex) {
      onOpen(realIndex % count);
    } else {
      swiper.slideToLoop(realIndex);
    }
  };

  // Jump to the nearest copy of a concept so dots never spin the long way round.
  const goTo = (index: number) => {
    const swiper = swiperRef.current;
    if (!swiper) return;
    const total = slides.length;
    const current = swiper.realIndex;
    const candidates = [index, index + count];
    const nearest = candidates.reduce((best, c) => {
      const dist = (x: number) => Math.min(Math.abs(x - current), total - Math.abs(x - current));
      return dist(c) < dist(best) ? c : best;
    }, candidates[0]);
    swiper.slideToLoop(nearest);
  };

  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className="relative w-full overflow-hidden bg-white"
    >
      <style>{css}</style>
      <Swiper
        className="concept-carousel"
        modules={[EffectCoverflow, Autoplay]}
        effect="coverflow"
        coverflowEffect={{
          rotate: 30,
          stretch: 0,
          depth: 220,
          modifier: 1,
          slideShadows: true,
        }}
        slidesPerView="auto"
        centeredSlides
        loop
        grabCursor
        spaceBetween={0}
        autoplay={
          reduced
            ? false
            : {
                delay: 2500,
                pauseOnMouseEnter: true,
                disableOnInteraction: false,
              }
        }
        onSwiper={(s) => {
          swiperRef.current = s;
          onSwiper?.(s);
        }}
        onSlideChange={setActiveFrom}
        onClick={handleClick}
      >
        {slides.map((c, i) => (
          <SwiperSlide
            key={`${c.slug}-${i}`}
            aria-label={`${c.name}, ${c.category}`}
          >
            <Image
              src={slideImage(c)}
              alt={`${c.name} ${c.category.toLowerCase()} website concept by Nuit Works, homepage`}
              fill
              sizes="(min-width: 768px) min(40vw, 820px), min(78vw, 300px)"
              className="object-cover object-top"
              quality={90}
              draggable={false}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        className="mt-6 flex items-center justify-center gap-[10px]"
        role="tablist"
        aria-label="Concepts"
      >
        {concepts.map((c, i) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={c.name}
            onClick={() => goTo(i)}
            className={cn(
              "h-[6px] w-[6px] rounded-full border border-black transition-colors duration-200",
              i === active ? "bg-black" : "bg-white",
            )}
          />
        ))}
      </div>
    </m.div>
  );
}
