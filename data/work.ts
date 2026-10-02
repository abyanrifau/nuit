import type { LightColor } from "@/lib/light";
import { workSources } from "./concept-sources";
import { mediaVersions } from "./media-versions";

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
  role: "Display" | "Body" | "Data";
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
  /** One sentence: the problem this kind of business has (not a claim about a client). */
  problem: string;
  /** One sentence: the standout feature built to solve it. */
  usp: string;
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

/**
 * A media path with its concept's content version (?v=, see
 * scripts/media-versions.mjs). Browsers keep concept media for a year, so a
 * recapture has to arrive under a new URL.
 */
const versioned = (file: string) => {
  const v = mediaVersions[file.split("/")[2]];
  return v ? `${file}?v=${v}` : file;
};

/** Paths to a project's captured media in public/work/<slug>/. */
export const media = (slug: string) => {
  const at = (file: string) => versioned(`/work/${slug}/${file}`);
  return {
    desktop: { webm: at("desktop.webm"), mp4: at("desktop.mp4"), poster: at("desktop-poster.webp"), width: 1280, height: 800 },
    mobile: { webm: at("mobile.webm"), mp4: at("mobile.mp4"), poster: at("mobile-poster.webp"), width: 600, height: 1298 },
  };
};

const page = (slug: string, file: string, label: string): Shot => ({
  label,
  file: versioned(`/work/${slug}/pages/${file}`),
  width: 1440,
  height: 900,
});

const entries: Work[] = [
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
    problem:
      "Guests booking a small guesthouse often have to message back and forth just to find out which rooms are free and what the stay will really cost.",
    usp:
      "A four-step booking flow that shows only the rooms free on your dates, with the full price, taxes included, before asking for any details.",
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
    problem:
      "You can't smell perfume through a screen, so most people shopping online can only buy by brand name and hope it suits them.",
    usp:
      "A shop sorted by nine scent families, where every bottle explains its notes, how far it carries and how long it lasts, in plain words.",
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
    name: "VERUM",
    kind: "Concept",
    industry: "Skincare shop",
    location: "Malé, Maldives",
    year: 2026,
    url: urlFor("verum"),
    summary: "An online skincare shop with a 30-second quiz that builds your routine.",
    headline: "Shop skincare that earns its place.",
    problem:
      "Skincare shoppers can't tell which products suit their skin or whether they're genuine, so they hesitate to buy online.",
    usp:
      "A 30-second skin quiz that builds a priced morning and evening routine, explains every pick and adds the lot to the cart with the bundle discount already applied.",
    brief:
      "VERUM is a Malé retailer of Korean and Western skincare, with the line \"Formula first.\" It sells online, so the site has to do a good shop assistant's job: help people who don't know where to start, show that every product is genuine and what is really in it, and make buying a full routine easy.",
    approach: [
      {
        title: "Layout",
        body: "A clean, lab-like catalogue on paper white with thin rules. Every product card carries a code, its size and routine step, and product pages give the formula breakdown as much room as the photo.",
      },
      {
        title: "Typography",
        body: "Geist for headlines and reading, with Geist Mono for product codes, prices, labels and formula data, so the numbers read like a spec sheet.",
      },
      {
        title: "Colour",
        body: "Paper, bone and ink, with sage tints and one deep green for every action. Calm enough that the information leads.",
      },
      {
        title: "Interaction",
        body: "A three-tap quiz that ranks a routine and shows its reasons, a routine builder with a live savings bar and layering warnings, side-by-side compare, and quick view and add to cart from any product card.",
      },
    ],
    result:
      "A full shop of 50 products from 21 brands, built for online sales. Shoppers can take the quiz, build and adjust an AM and PM routine with bundle savings, compare products, look up any ingredient, and check out on one page with delivery across Malé or pickup.",
    built: [
      "Home, Shop, product, brand, ingredient, Philosophy and Delivery pages",
      "30-second skin quiz: three questions, a ranked AM and PM routine with reasons and swaps",
      "Routine builder with layering warnings, a shareable link and bundle savings of up to 15%",
      "Formula breakdowns that show published ingredient strengths, and say Not published where a brand gives none",
      "Compare up to three products side by side, including price per 10 ml",
      "Ingredient explorer for 20 ingredients, with a pair checker",
      "Cart and one-page checkout with delivery zones, pickup, and card or BML transfer",
    ],
    note: "VERUM is a fictional shop. The skincare brands shown are real and belong to their owners; none of them is a client or partner of Nuit Works. Checkout is a prototype: no order is placed and no payment is taken.",
    palette: [
      { name: "Paper", hex: "#FAFAF8", role: "Background" },
      { name: "Ink", hex: "#141414", role: "Text" },
      { name: "Deep green", hex: "#1D2A1F", role: "Buttons and actions" },
      { name: "Sage", hex: "#566754", role: "Savings and accents" },
      { name: "Bone", hex: "#F1F1EC", role: "Surfaces" },
    ],
    typefaces: [
      { role: "Display", family: "Geist", style: "SemiBold 600", usage: "Headlines and product names", specimen: "/work/verum/specimens/display.webp" },
      { role: "Data", family: "Geist Mono", style: "Regular 400", usage: "Product codes, prices, labels and formula data", specimen: "/work/verum/specimens/data.webp" },
    ],
    components: [
      { label: "Navigation", file: "/work/verum/components/navigation.webp", width: 1425, height: 69 },
      { label: "Button", file: "/work/verum/components/button.webp", width: 380, height: 122 },
      { label: "Product card", file: "/work/verum/components/card.webp", width: 379, height: 613 },
    ],
    pages: [
      page("verum", "01-home.webp", "Home"),
      page("verum", "02-shop.webp", "Shop"),
      page("verum", "03-skin-quiz.webp", "Skin quiz"),
      page("verum", "04-routine-builder.webp", "Routine builder"),
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
    problem:
      "A late-opening coffee bar sells an evening atmosphere, but a social feed rarely tells people when it's open, how to find it or whether they can book a space.",
    usp:
      "A visit page with the hours, step-by-step directions to the door and an enquiry form for booking the back room for tastings and private evenings.",
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
    problem:
      "A café that relies on social media has no single place where people can see the menu, prices, events and how to find it.",
    usp:
      "An events page where people can ask for a seat at a weekend cupping or pour-over class, or for the private back room, with the full priced menu one click away.",
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
      { label: "Button", file: "/work/fuku-coffee/components/button.webp", width: 216, height: 100 },
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
    problem:
      "Furniture is a big, slow purchase, and people won't buy a sofa online unless they're sure it will fit their room and know when it will arrive.",
    usp:
      "Product pages that put exact dimensions, the made-to-order lead time, materials and care right next to the price, so buyers can check the fit before they commit.",
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
      { label: "Button", file: "/work/homestead/components/button.webp", width: 310, height: 120 },
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

// Specimens and component captures are written as plain paths above; version them too.
export const work: Work[] = entries.map((w) => ({
  ...w,
  typefaces: w.typefaces.map((t) => ({ ...t, specimen: versioned(t.specimen) })),
  components: w.components.map((c) => ({ ...c, file: versioned(c.file) })),
}));

export const getWork = (slug: string) => work.find((w) => w.slug === slug);

/** The project after this one, wrapping around to the first. */
export const nextWork = (slug: string) => {
  const i = work.findIndex((w) => w.slug === slug);
  return work[(i + 1) % work.length];
};

/** "verum.nuit.works" style host, for browser frames. */
export const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};
