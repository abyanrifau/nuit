import type { LightColor } from "@/lib/light";
import { workSources } from "./concept-sources";

/*
 * Every piece of work on the site, in the order it is shown.
 *
 * To add a project:
 *   1. Add its slug and live URL to data/concept-sources.ts.
 *   2. Run `npm run capture -- <slug>` to record the videos, screenshots,
 *      type specimens and design system into public/work/<slug>/.
 *   3. Check scripts/output/<slug>.json and copy the fonts, colours and file
 *      names you want into a new entry below.
 *
 * `kind` keeps concepts honest: the six below are sites we designed and
 * built to show what we can do, not client work. A real project is added
 * with kind "Client" and is labelled that way everywhere.
 */

export type WorkKind = "Concept" | "Client";

export type Swatch = { name: string; hex: string; role: string };

export type Typeface = {
  role: "Display" | "Body";
  family: string;
  /** e.g. "Light 300" */
  style: string;
  usage: string;
  /** Specimen image rendered in the site's own font, light on transparent. */
  specimen: string;
};

export type Shot = { label: string; file: string; width: number; height: number };

export type Work = {
  slug: string;
  name: string;
  kind: WorkKind;
  industry: string;
  location: string;
  year: number;
  url: string;
  /** One line for lists and cards. */
  summary: string;
  /** The concept's own headline, shown in quotes. */
  headline: string;
  brief: string;
  approach: { title: string; body: string }[];
  result: string;
  built: string[];
  /** Anything a visitor should know about what is real and what is a stand-in. */
  note?: string;
  palette: Swatch[];
  typefaces: Typeface[];
  components: Shot[];
  pages: Shot[];
  /** The light that gathers around this project on hover. */
  light: LightColor;
};

const urlFor = (slug: string) => workSources.find((s) => s.slug === slug)?.url ?? "";

/** Paths to a project's captured media in public/work/<slug>/. */
export const media = (slug: string) => {
  const base = `/work/${slug}`;
  return {
    desktop: { webm: `${base}/desktop.webm`, mp4: `${base}/desktop.mp4`, poster: `${base}/desktop-poster.webp`, width: 1280, height: 800 },
    mobile: { webm: `${base}/mobile.webm`, mp4: `${base}/mobile.mp4`, poster: `${base}/mobile-poster.webp`, width: 600, height: 1298 },
    full: `${base}/full.webp`,
    fullMobile: `${base}/full-mobile.webp`,
  };
};

const page = (slug: string, file: string, label: string): Shot => ({
  label,
  file: `/work/${slug}/pages/${file}`,
  width: 1440,
  height: 900,
});

export const work: Work[] = [
  {
    slug: "driftwood",
    name: "Driftwood",
    kind: "Concept",
    industry: "Guesthouse",
    location: "Maafushi, Maldives",
    year: 2026,
    url: urlFor("driftwood"),
    summary: "A guesthouse site with a full booking flow, from dates to confirmation.",
    headline: "A quiet stay on Maafushi.",
    brief:
      "A guesthouse lives on direct bookings. Guests want to see the rooms, understand the island and check dates without messaging back and forth. The site has to feel calm and trustworthy, and make booking the obvious next step.",
    approach: [
      {
        title: "Layout",
        body: "Full-bleed photography and generous space, so the site feels like the stay itself. Each room gets a three-photo spread with its details beside it.",
      },
      {
        title: "Typography",
        body: "Cormorant Garamond at a light weight for headlines, Jost for everything practical. The serif sets the mood; the sans keeps prices and details easy to scan.",
      },
      {
        title: "Colour",
        body: "Sand, clay and timber, taken from the island. One clay colour marks every action, so guests always know where to click.",
      },
      {
        title: "Interaction",
        body: "Slow parallax on the photography, headlines that reveal line by line, and room spreads that hold in place while their details scroll past.",
      },
    ],
    result:
      "Six pages and a four-step booking flow. Guests pick dates on a calendar, see only the rooms that fit, add experiences, enter their details and get an itemised confirmation.",
    built: [
      "Home, Rooms, Experiences, About and Contact pages",
      "Booking flow: dates, room, guest details, confirmation",
      "Availability calendar with a running price summary",
      "Experiences that carry over into a booking",
      "Full-screen mobile menu",
    ],
    note: "The calendar runs on sample availability. For a real guesthouse it would connect to their booking system.",
    palette: [
      { name: "Sand", hex: "#F5F1EA", role: "Background" },
      { name: "Ink", hex: "#2B2622", role: "Text" },
      { name: "Clay", hex: "#8E5A3C", role: "Actions" },
      { name: "Wood", hex: "#6B5B4D", role: "Accents" },
      { name: "Panel", hex: "#EDE7DC", role: "Surfaces" },
    ],
    typefaces: [
      { role: "Display", family: "Cormorant Garamond", style: "Light 300", usage: "Headlines", specimen: "/work/driftwood/specimens/display.webp" },
      { role: "Body", family: "Jost", style: "Light 300", usage: "Body, buttons and labels", specimen: "/work/driftwood/specimens/body.webp" },
    ],
    components: [
      { label: "Navigation", file: "/work/driftwood/components/navigation.webp", width: 1440, height: 79 },
      { label: "Button", file: "/work/driftwood/components/button.webp", width: 260, height: 113 },
    ],
    pages: [
      page("driftwood", "01-home.webp", "Home"),
      page("driftwood", "02-rooms.webp", "Rooms"),
      page("driftwood", "03-experiences.webp", "Experiences"),
      page("driftwood", "04-about.webp", "About"),
    ],
    light: "amber",
  },
  {
    slug: "scentu",
    name: "Scentu",
    kind: "Concept",
    industry: "Fragrance",
    location: "Malé, Maldives",
    year: 2026,
    url: urlFor("scentu"),
    summary: "A fragrance shop sorted by how things smell, not by brand.",
    headline: "Find your scent. By smell, not by house.",
    brief:
      "Most people choose perfume by name, because they cannot smell it online. A fragrance boutique needs a way to describe scent that anyone can follow, and a shop that feels as considered as the bottles.",
    approach: [
      {
        title: "Layout",
        body: "A dark, editorial layout that lets moody bottle photography carry the page. Nine scent families are the main way into the shop.",
      },
      {
        title: "Typography",
        body: "Classy Vogue, a high-contrast display face, for headlines. Geist for reading, and Instrument Serif italics for small accents.",
      },
      {
        title: "Colour",
        body: "Near-black and warm bone, nothing else. Each scent family gets its own small colour, used only where it helps you find your way.",
      },
      {
        title: "Interaction",
        body: "A hero that rotates through featured bottles and tilts toward the cursor, a draggable row of signature picks, magnetic buttons and a bag that slides in from the side.",
      },
    ],
    result:
      "A full shop: filters by scent family, product pages that explain each fragrance in plain terms, and a bag that remembers what you picked.",
    built: [
      "Home, Shop, product and About pages",
      "Filters by gender and nine scent families, with sorting",
      "Product pages with note pyramid, sillage and longevity scales, and a size picker",
      "Slide-out bag with quantities",
      "Bottle request form and newsletter sign-up",
    ],
    note: "Checkout is a prototype step here. A real shop would connect payments.",
    palette: [
      { name: "Ink", hex: "#0B0B0C", role: "Background" },
      { name: "Bone", hex: "#F2EEE6", role: "Text" },
      { name: "Panel", hex: "#151517", role: "Surfaces" },
      { name: "Stone", hex: "#8C8880", role: "Secondary text" },
      { name: "Citrus", hex: "#F5D33A", role: "Scent family accent" },
    ],
    typefaces: [
      { role: "Display", family: "Classy Vogue", style: "Regular 400", usage: "Headlines", specimen: "/work/scentu/specimens/display.webp" },
      { role: "Body", family: "Geist", style: "Regular 400", usage: "Body and interface", specimen: "/work/scentu/specimens/body.webp" },
    ],
    components: [
      { label: "Navigation", file: "/work/scentu/components/navigation.webp", width: 1440, height: 64 },
      { label: "Button", file: "/work/scentu/components/button.webp", width: 256, height: 116 },
      { label: "Product card", file: "/work/scentu/components/card.webp", width: 338, height: 460 },
    ],
    pages: [
      page("scentu", "01-home.webp", "Home"),
      page("scentu", "02-shop.webp", "Shop"),
      page("scentu", "03-about.webp", "About"),
    ],
    light: "rose",
  },
  {
    slug: "verum",
    name: "Verum",
    kind: "Concept",
    industry: "Skincare",
    location: "Malé, Maldives",
    year: 2026,
    url: urlFor("verum"),
    summary: "A skincare shop that puts the ingredients first.",
    headline: "Shop skincare that earns its place.",
    brief:
      "Skincare shoppers compare ingredients, not just brands. A skincare retailer needs to make that comparison easy, help people who don't know where to start, and still feel like a shop.",
    approach: [
      {
        title: "Layout",
        body: "A clean catalogue with generous spacing, and product pages that give the ingredient breakdown as much room as the product photo.",
      },
      {
        title: "Typography",
        body: "Fraunces for headings, a warm serif with character, set against Inter for body text and a mono face for prices and data, like a lab notebook.",
      },
      {
        title: "Colour",
        body: "Paper white, ink and a muted sage. The calm palette keeps attention on the information.",
      },
      {
        title: "Interaction",
        body: "Live search and filter chips, ingredient rows that open to show animated concentration bars, and a three-question quiz that ends in a ranked shortlist.",
      },
    ],
    result:
      "A catalogue you can search by product, brand or ingredient, product pages that show what is inside and why, and a quiz for people who want a starting point.",
    built: [
      "Home, Shop, product, Quiz, Philosophy and Contact pages",
      "Live search, sorting, and filters by category, origin, concern and brand",
      "Ingredient breakdowns with published concentrations",
      "\"Find your formula\" quiz with ranked results",
      "Cart drawer that remembers items",
    ],
    note: "The cart is a front-end prototype. A real shop would connect checkout and payments.",
    palette: [
      { name: "Paper", hex: "#FAFAF8", role: "Background" },
      { name: "Ink", hex: "#1C1C1A", role: "Text" },
      { name: "Sage", hex: "#8B9D83", role: "Fills and buttons" },
      { name: "Deep sage", hex: "#56654F", role: "Accent text" },
      { name: "Forest", hex: "#242A22", role: "Footer" },
    ],
    typefaces: [
      { role: "Display", family: "Fraunces", style: "Regular 400", usage: "Headlines", specimen: "/work/verum/specimens/display.webp" },
      { role: "Body", family: "Inter", style: "Regular 400", usage: "Body and small headings", specimen: "/work/verum/specimens/body.webp" },
    ],
    components: [
      { label: "Navigation", file: "/work/verum/components/navigation.webp", width: 1440, height: 69 },
      { label: "Button", file: "/work/verum/components/button.webp", width: 202, height: 124 },
      { label: "Product card", file: "/work/verum/components/card.webp", width: 458, height: 709 },
    ],
    pages: [
      page("verum", "01-home.webp", "Home"),
      page("verum", "02-shop.webp", "Shop"),
      page("verum", "03-find-your-formula.webp", "Quiz"),
      page("verum", "04-philosophy.webp", "Philosophy"),
    ],
    light: "olive",
  },
  {
    slug: "nocturne",
    name: "Nocturne",
    kind: "Concept",
    industry: "Coffee bar",
    location: "Malé, Maldives",
    year: 2026,
    url: urlFor("nocturne"),
    summary: "A coffee bar site built around low light and late evenings.",
    headline: "Slow coffee, low light.",
    brief:
      "A coffee bar that stays open late sells a feeling as much as a drink. The site needs to show the room, the menu and the hours, and make it easy to ask about private events.",
    approach: [
      {
        title: "Layout",
        body: "Cinematic full-bleed sections with looping video, alternating with quiet text, so the page has a slow rhythm.",
      },
      {
        title: "Typography",
        body: "Instrument Serif, with its italics, for headlines, and Karla for body text. Elegant without feeling formal.",
      },
      {
        title: "Colour",
        body: "Warm near-black with cream text and a single amber accent, like a room lit by lamps after dark.",
      },
      {
        title: "Interaction",
        body: "Videos load only as you approach them and play only while on screen. The nav turns solid after the hero, and sections fade in softly.",
      },
    ],
    result:
      "Four pages that set the mood and answer the practical questions: what's on the menu, when it's open, where it is, and how to book the back room.",
    built: [
      "Home, Menu, About and Visit pages",
      "Menu with tasting notes and a detailed single-origin card",
      "Events and private booking enquiry form with friendly validation",
      "Background video that loads only when needed",
      "Slide-in mobile menu",
    ],
    palette: [
      { name: "Ink", hex: "#1A1512", role: "Background" },
      { name: "Cream", hex: "#EDE3D3", role: "Text" },
      { name: "Amber", hex: "#C98A3E", role: "Accent and links" },
      { name: "Brick", hex: "#8B4A3A", role: "Details" },
      { name: "Dim cream", hex: "#B7A794", role: "Secondary text" },
    ],
    typefaces: [
      { role: "Display", family: "Instrument Serif", style: "Regular 400", usage: "Headlines", specimen: "/work/nocturne/specimens/display.webp" },
      { role: "Body", family: "Karla", style: "Regular 400", usage: "Body and interface", specimen: "/work/nocturne/specimens/body.webp" },
    ],
    components: [
      { label: "Navigation", file: "/work/nocturne/components/navigation.webp", width: 1440, height: 69 },
      { label: "Menu card", file: "/work/nocturne/components/card.webp", width: 416, height: 706 },
    ],
    pages: [
      page("nocturne", "01-home.webp", "Home"),
      page("nocturne", "02-menu.webp", "Menu"),
      page("nocturne", "03-about.webp", "About"),
      page("nocturne", "04-visit.webp", "Visit"),
    ],
    light: "rust",
  },
  {
    slug: "fuku-coffee",
    name: "Fuku Coffee",
    kind: "Concept",
    industry: "Café",
    location: "Hulhumalé, Maldives",
    year: 2026,
    url: urlFor("fuku-coffee"),
    summary: "A calm café site with a Japanese touch.",
    headline: "Good fortune, poured slowly.",
    brief:
      "A neighbourhood café needs people to find it, see the menu and know when it's open. For Fuku, the site also had to carry the café's quiet, Japanese-inspired character.",
    approach: [
      {
        title: "Layout",
        body: "Plenty of space, soft photography of plaster, teak and daylight, and short sections that read like a slow morning.",
      },
      {
        title: "Typography",
        body: "Louis George Cafe at a light weight for headings and body, with a typewriter face for small labels, prices and hours.",
      },
      {
        title: "Colour",
        body: "Cream, walnut and terracotta on an off-white base. Warm, quiet and easy to read.",
      },
      {
        title: "Interaction",
        body: "A staggered rise-in on the hero, sections that fade in as you scroll, and a header that changes once you start scrolling.",
      },
    ],
    result:
      "Six pages covering everything a café visitor looks for: the menu with prices, the story, photos, events, opening hours and how to get there.",
    built: [
      "Home, Menu, Story, Gallery, Events and Visit pages",
      "Full menu with prices in MVR",
      "Reservation and event enquiry form with a friendly confirmation",
      "Captioned photo gallery",
      "Mobile navigation",
    ],
    palette: [
      { name: "Off-white", hex: "#F2F4F3", role: "Background" },
      { name: "Ink", hex: "#242331", role: "Body text" },
      { name: "Walnut dark", hex: "#5E503F", role: "Headings and footer" },
      { name: "Walnut", hex: "#7F5539", role: "Buttons and links" },
      { name: "Cream", hex: "#EDE0D4", role: "Sections" },
    ],
    typefaces: [
      { role: "Display", family: "Louis George Cafe", style: "Light 300", usage: "Headlines", specimen: "/work/fuku-coffee/specimens/display.webp" },
      { role: "Body", family: "Louis George Cafe", style: "Regular 400", usage: "Body and navigation", specimen: "/work/fuku-coffee/specimens/body.webp" },
    ],
    components: [
      { label: "Navigation", file: "/work/fuku-coffee/components/navigation.webp", width: 1440, height: 76 },
      { label: "Button", file: "/work/fuku-coffee/components/button.webp", width: 206, height: 109 },
      { label: "Menu card", file: "/work/fuku-coffee/components/card.webp", width: 400, height: 224 },
    ],
    pages: [
      page("fuku-coffee", "01-home.webp", "Home"),
      page("fuku-coffee", "02-our-story.webp", "Our Story"),
      page("fuku-coffee", "03-gallery.webp", "Gallery"),
      page("fuku-coffee", "04-events.webp", "Events"),
    ],
    light: "amber",
  },
  {
    slug: "homestead",
    name: "Homestead",
    kind: "Concept",
    industry: "Furniture",
    location: "Hulhumalé, Maldives",
    year: 2026,
    url: urlFor("homestead"),
    summary: "A furniture shop with six pieces and room to breathe.",
    headline: "Furniture for the quiet hours.",
    brief:
      "Furniture is bought slowly. A furniture maker needs a site that shows each piece properly, answers practical questions like size and lead time, and feels as calm as the rooms it furnishes.",
    approach: [
      {
        title: "Layout",
        body: "Six products, no clutter. Large sunlit photography, product cards that switch to a lifestyle shot on hover, and lots of white space.",
      },
      {
        title: "Typography",
        body: "Cormorant Garamond, a classical serif, for headings, with Inter for body text and details.",
      },
      {
        title: "Colour",
        body: "Cream, espresso and walnut. Warm neutrals that let the wood and fabric do the talking.",
      },
      {
        title: "Interaction",
        body: "A hero that slowly settles in, prices that reveal on hover, and a smooth slide-out cart drawer.",
      },
    ],
    result:
      "A shop that takes its time: every piece has proper photos, dimensions, lead time and care details, with a cart that remembers what you picked.",
    built: [
      "Home, Shop, product, Story and Contact pages",
      "Filters by room and sorting by price",
      "Product pages with image tabs, dimensions, lead time and care details",
      "Slide-out cart drawer with quantities",
      "Newsletter and contact forms",
    ],
    note: "The cart is a front-end prototype. A real shop would connect checkout and payments.",
    palette: [
      { name: "Cream", hex: "#F7F3EC", role: "Background" },
      { name: "Espresso", hex: "#2B241D", role: "Text" },
      { name: "Walnut", hex: "#7A5C42", role: "Accents" },
      { name: "Deep walnut", hex: "#5B4636", role: "Buttons" },
      { name: "Stone", hex: "#75695B", role: "Secondary text" },
    ],
    typefaces: [
      { role: "Display", family: "Cormorant Garamond", style: "Medium 500", usage: "Headlines", specimen: "/work/homestead/specimens/display.webp" },
      { role: "Body", family: "Inter", style: "Regular 400", usage: "Body and details", specimen: "/work/homestead/specimens/body.webp" },
    ],
    components: [
      { label: "Navigation", file: "/work/homestead/components/navigation.webp", width: 1440, height: 64 },
      { label: "Button", file: "/work/homestead/components/button.webp", width: 311, height: 120 },
      { label: "Product card", file: "/work/homestead/components/card.webp", width: 451, height: 607 },
    ],
    pages: [
      page("homestead", "01-home.webp", "Home"),
      page("homestead", "02-shop.webp", "Shop"),
      page("homestead", "03-story.webp", "Story"),
      page("homestead", "04-contact.webp", "Contact"),
    ],
    light: "olive",
  },
];

export const getWork = (slug: string) => work.find((w) => w.slug === slug);

/** The project after this one, wrapping around to the first. */
export const nextWork = (slug: string) => {
  const i = work.findIndex((w) => w.slug === slug);
  return work[(i + 1) % work.length];
};

/** "driftwood.vercel.app" style host, for browser frames. */
export const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};
