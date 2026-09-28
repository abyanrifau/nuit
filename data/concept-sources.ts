/*
 * The live URL of every piece of work, keyed by slug. Kept free of imports so
 * the capture script (scripts/capture-concepts.mjs) can read it with Node's
 * built-in TypeScript support. Add a line here when you add a project to
 * data/work.ts, then run `npm run capture -- <slug>`.
 */

export type WorkSource = {
  slug: string;
  url: string;
  /**
   * Optional selectors for the design-system component captures. When left
   * out, the capture script picks the header, the first solid button and the
   * first card-like block it can find.
   */
  components?: { name: string; selector: string }[];
};

export const workSources: WorkSource[] = [
  { slug: "fuku-coffee", url: "https://cafe-nuit.vercel.app" },
  { slug: "driftwood", url: "https://guesthouse-nuit.vercel.app" },
  { slug: "verum", url: "https://skincare-nuit.vercel.app" },
  { slug: "homestead", url: "https://furniture-nuit.vercel.app" },
  { slug: "scentu", url: "https://perfume-nuit.vercel.app" },
  { slug: "nocturne", url: "https://cafe2-nuit.vercel.app" },
];
