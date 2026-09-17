import type { Metadata } from "next";
import { NotFound } from "@/components/NotFound";

export const metadata: Metadata = {
  title: "Page not found: Nuit Works",
  robots: { index: false, follow: false },
};

/* Server wrapper so the page can carry its own metadata; the page itself is
   a client component for the motion setup. */
export default function NotFoundPage() {
  return <NotFound />;
}
