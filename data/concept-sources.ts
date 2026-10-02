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
  /**
   * Optional scripted recording, per size, used instead of a plain homepage
   * scroll when the standout part of a concept is a flow (a quiz, a
   * builder). Steps run in order; see recordTour() in the capture script.
   */
  tour?: { desktop: TourStep[]; mobile: TourStep[] };
};

/**
 * goto: open a path (a soft cross-fade into it). hold: keep the frame.
 * scroll: ease to a y position or to an element (top, minus 80px).
 * click: click an element, then film it reacting for `s` seconds.
 * Selectors are Playwright selectors.
 */
export type TourStep =
  | { goto: string }
  | { hold: number }
  | { scroll: number | string; s: number }
  | { click: string; s: number };

// VERUM's two standout features, filmed as a visitor would use them: the
// three-question skin quiz to its priced routine, then the routine builder
// filling a few steps (its savings bar and layering warning react).
const verumTour = (kind: "desktop" | "mobile"): TourStep[] => [
  { goto: "/" },
  { hold: 1.4 },
  { scroll: "text=Three taps to a full routine.", s: 1.8 },
  { hold: 0.8 },
  { goto: "/quiz" },
  { hold: 0.9 },
  { click: "main button:has-text('Combination')", s: 1.1 },
  { click: "main button:has-text('Dark spots')", s: 1.1 },
  { click: "main button:has-text('Gets irritated sometimes')", s: 1.6 },
  { hold: 0.8 },
  { scroll: kind === "desktop" ? 620 : 900, s: 2.4 },
  { hold: 0.8 },
  { goto: "/routine" },
  { hold: 0.9 },
  { click: 'role=button[name="Choose a cleanser for AM"]', s: 1.2 },
  { click: "button:text-is('Choose') >> visible=true >> nth=0", s: 1.0 },
  { click: 'role=button[name="Choose an exfoliant for PM"]', s: 1.2 },
  { click: "button:text-is('Choose') >> visible=true >> nth=0", s: 1.0 },
  { click: 'role=button[name="Choose a treatment for PM"]', s: 1.2 },
  { click: "button:text-is('Choose') >> visible=true >> nth=0", s: 1.6 },
  { hold: 1.2 },
];


export const workSources: WorkSource[] = [
  { slug: "fuku-coffee", url: "https://fukucoffee.nuit.works" },
  { slug: "driftwood", url: "https://guesthouse-nuit.vercel.app" },
  { slug: "verum", url: "https://verum.nuit.works", tour: { desktop: verumTour("desktop"), mobile: verumTour("mobile") } },
  { slug: "homestead", url: "https://homestead.nuit.works" },
  { slug: "scentu", url: "https://perfume-nuit.vercel.app" },
  { slug: "nocturne", url: "https://cafe2-nuit.vercel.app" },
];
