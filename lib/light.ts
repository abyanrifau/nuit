/*
 * The prism light that fills the whole site. One fixed layer (LightField)
 * draws a handful of soft, heavily blurred fields of colour. Each section
 * names a mood with `data-light="..."`; as it crosses the middle of the
 * screen, the fields glide to that mood's positions and strengths. Anything
 * can also pull a focus light toward a point (the gallery does on hover).
 *
 * Colours are the dusty tones sampled from the hero prism, never neon.
 */

export const LIGHT_COLORS = {
  steel: "#2b6694",
  teal: "#538894",
  olive: "#948a56",
  amber: "#946842",
  rust: "#945043",
  rose: "#946779",
  violet: "#6a5a8f",
} as const;

export type LightColor = keyof typeof LIGHT_COLORS;

/** One field: centre (0 to 1 of the viewport, y down), radius (of viewport height), strength, colour. */
export type Field = [x: number, y: number, r: number, strength: number, color: LightColor];

/** Five fields per mood; the sixth slot is the focus light. */
export type Mood = { fields: [Field, Field, Field, Field, Field]; exposure: number };

export const MOODS = {
  // The prism carries the hero's light itself; the field only extends its
  // colours faintly toward the edges, so the black around it stays black.
  hero: {
    exposure: 1,
    fields: [
      [0.72, 0.24, 0.34, 0.12, "amber"],
      [0.5, 0.62, 0.4, 0.1, "steel"],
      [0.9, 0.5, 0.34, 0.1, "rust"],
      [0.12, 0.98, 0.4, 0.08, "teal"],
      [0.98, 0.06, 0.3, 0.08, "rose"],
    ],
  },
  // Wide bands across the page, like the old "Who we are" aurora.
  intro: {
    exposure: 1,
    fields: [
      [0.06, 0.46, 0.42, 0.44, "rose"],
      [0.34, 0.36, 0.4, 0.46, "steel"],
      [0.62, 0.4, 0.4, 0.34, "olive"],
      [0.94, 0.5, 0.4, 0.4, "rust"],
      [0.5, 1.02, 0.46, 0.16, "teal"],
    ],
  },
  // Dim, so the recordings carry the colour.
  work: {
    exposure: 0.9,
    fields: [
      [0.12, 1.0, 0.5, 0.2, "steel"],
      [0.9, 0.02, 0.42, 0.16, "rust"],
      [0.5, 0.5, 0.3, 0.02, "olive"],
      [0.7, 1.05, 0.4, 0.1, "violet"],
      [0.02, 0.1, 0.3, 0.06, "teal"],
    ],
  },
  why: {
    exposure: 1,
    fields: [
      [0.9, 0.2, 0.42, 0.4, "amber"],
      [0.72, 0.02, 0.32, 0.22, "rust"],
      [0.08, 0.86, 0.44, 0.3, "teal"],
      [0.34, 1.02, 0.36, 0.14, "steel"],
      [0.5, 0.5, 0.3, 0.02, "rose"],
    ],
  },
  services: {
    exposure: 1,
    fields: [
      [0.02, 0.3, 0.42, 0.32, "violet"],
      [0.2, 0.9, 0.42, 0.26, "steel"],
      [0.94, 0.72, 0.38, 0.16, "rose"],
      [0.6, 0.02, 0.3, 0.08, "teal"],
      [0.5, 0.5, 0.3, 0.02, "olive"],
    ],
  },
  process: {
    exposure: 1,
    fields: [
      [0.5, 0.18, 0.44, 0.18, "teal"],
      [0.12, 0.8, 0.36, 0.14, "olive"],
      [0.88, 0.84, 0.36, 0.16, "steel"],
      [0.5, 1.05, 0.4, 0.1, "amber"],
      [0.02, 0.1, 0.3, 0.04, "rose"],
    ],
  },
  pricing: {
    exposure: 1,
    fields: [
      [0.12, 0.14, 0.42, 0.28, "rose"],
      [0.9, 0.86, 0.42, 0.28, "amber"],
      [0.56, 0.5, 0.34, 0.06, "violet"],
      [0.98, 0.1, 0.3, 0.1, "steel"],
      [0.04, 0.96, 0.3, 0.1, "teal"],
    ],
  },
  // The light gathers and intensifies behind the final call to action.
  cta: {
    exposure: 1.2,
    fields: [
      [0.62, 0.34, 0.4, 0.58, "amber"],
      [0.84, 0.6, 0.38, 0.5, "rust"],
      [0.4, 0.62, 0.44, 0.5, "steel"],
      [0.18, 0.3, 0.38, 0.38, "rose"],
      [0.56, 0.98, 0.44, 0.34, "teal"],
    ],
  },
  footer: {
    exposure: 1,
    fields: [
      [0.5, 1.08, 0.56, 0.3, "steel"],
      [0.12, 1.02, 0.36, 0.16, "rose"],
      [0.9, 1.04, 0.36, 0.18, "amber"],
      [0.5, 0.3, 0.3, 0.02, "teal"],
      [0.02, 0.1, 0.3, 0.02, "olive"],
    ],
  },
  // Behind the contact form: warm, but quiet enough for labels and fields.
  contact: {
    exposure: 1,
    fields: [
      [0.94, 0.16, 0.38, 0.24, "amber"],
      [0.06, 0.9, 0.42, 0.22, "steel"],
      [0.78, 0.94, 0.34, 0.1, "rust"],
      [0.12, 0.08, 0.3, 0.08, "rose"],
      [0.5, 0.5, 0.3, 0.0, "teal"],
    ],
  },
  // A calm default for inner pages.
  page: {
    exposure: 1,
    fields: [
      [0.06, 0.08, 0.44, 0.26, "steel"],
      [0.94, 0.9, 0.44, 0.22, "rust"],
      [0.86, 0.12, 0.3, 0.12, "rose"],
      [0.2, 0.96, 0.3, 0.08, "teal"],
      [0.5, 0.5, 0.3, 0.02, "olive"],
    ],
  },
} satisfies Record<string, Mood>;

export type MoodName = keyof typeof MOODS;

type Focus = { x: number; y: number; strength: number; color: LightColor };
type State = { mood: MoodName; focus: Focus };
type Listener = (s: State) => void;

const state: State = {
  mood: "hero",
  focus: { x: 0.5, y: 0.5, strength: 0, color: "amber" },
};
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l(state));

export const light = {
  get state() {
    return state;
  },
  setMood(mood: MoodName) {
    if (state.mood === mood) return;
    state.mood = mood;
    emit();
  },
  /** Pull a focus light toward a viewport point (0 to 1). */
  focus(x: number, y: number, strength = 0.5, color: LightColor = "amber") {
    state.focus = { x, y, strength, color };
    emit();
  },
  release() {
    state.focus = { ...state.focus, strength: 0 };
    emit();
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
