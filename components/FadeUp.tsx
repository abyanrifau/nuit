"use client";

import { m, useReducedMotion } from "framer-motion";
import type { ReactNode, Ref } from "react";

type FadeUpProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  ref?: Ref<HTMLElement>;
};

export function FadeUp({ children, className, id, ref }: FadeUpProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <section id={id} ref={ref} className={className}>
        {children}
      </section>
    );
  }

  return (
    <m.section
      id={id}
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </m.section>
  );
}
