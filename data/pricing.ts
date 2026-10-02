/*
 * Pricing. Website packages (one-off builds) and hosting and support plans
 * (monthly) are kept apart on purpose, so nobody mistakes one for the other.
 * Every website price is a starting price; the final price is quoted on the
 * size of the project. Change anything here and it updates everywhere,
 * including the contact form's package menu and the package picker.
 */

export type PackageId = "essential" | "business" | "commerce";
export type PlanId = "standard" | "priority";

export type Package = {
  id: PackageId;
  name: string;
  price: string;
  /** Who it's for, in one line. */
  goodFor: string;
  includes: string[];
  /** A short extra under the list, if any. */
  note?: string;
  /** Typical timeline, shown as "Typical timeline: about 1 week". */
  timeline: string;
  popular?: boolean;
  /** A concept from our work that shows what this package can look like. */
  example: { slug: string; note: string };
};

export const packages: Package[] = [
  {
    id: "essential",
    name: "Essential",
    price: "MVR 3,500",
    goodFor: "Businesses that need a clean, standout online presence.",
    includes: [
      "A custom one-page site",
      "Menu or services section",
      "Photo gallery",
      "Contact details and map",
      "WhatsApp and Instagram links",
      "Mobile-ready",
      "Basic SEO setup",
    ],
    note: "Can be upgraded to Business later, with a loyalty discount.",
    timeline: "about 1 week",
    example: {
      slug: "fuku-coffee",
      note: "Picture Fuku Coffee as one page: the menu, a few photos, opening hours and the map.",
    },
  },
  {
    id: "business",
    name: "Business",
    price: "MVR 7,500",
    goodFor: "Businesses that need more room to show what they offer, and to take bookings.",
    includes: [
      "Everything in Essential",
      "A multi-page custom site",
      "Booking or reservation requests, confirmed by you by hand",
      "A contact form",
    ],
    timeline: "about 2 to 3 weeks",
    popular: true,
    example: {
      slug: "driftwood",
      note: "Driftwood shows what a Business site can be: several pages and a booking request flow with a price on every date.",
    },
  },
  {
    id: "commerce",
    name: "Commerce",
    price: "MVR 12,500",
    goodFor: "Shops and businesses that want to sell products online.",
    includes: [
      "Everything in Business",
      "An online shop: product catalog, cart and order flow",
      "Payment by bank transfer or mobile payment, confirmed by you by hand (no payment gateway)",
      "An owner admin area to manage products and orders",
    ],
    timeline: "about 3 to 5 weeks",
    example: {
      slug: "scentu",
      note: "Scentu shows the shop side of Commerce: a catalog, filters, product pages and a bag.",
    },
  },
];

export const getPackage = (id: string) => packages.find((p) => p.id === id);

/** Shown under the timeline on every card. */
export const timelineNote = "The actual timeline is quoted based on the size of the project.";

/* ---------------------------------------------------------------- hosting */

export type Plan = { id: PlanId; name: string; price: string; per: string; adds?: string[] };

export const plans: Plan[] = [
  { id: "standard", name: "Standard", price: "MVR 300", per: "/month" },
  {
    id: "priority",
    name: "Priority",
    price: "MVR 500",
    per: "/month",
    adds: ["Faster response times", "Your requests are handled first"],
  },
];

export const planIncludes = [
  "Hosting and domain management",
  "Fixes",
  "Security updates and backups",
  "Small content edits, like menu, price, photo or opening hours changes",
  "Regular check-ups",
];

export const planNote = "Domain and hosting fees are quoted separately per project.";

/* ------------------------------------------------------------- comparison */

/** true = included, false = not included, a string = included, with this detail. */
export type Cell = boolean | string;
export type CompareRow = { feature: string; cells: Record<PackageId, Cell> };

const all = (v: Cell): Record<PackageId, Cell> => ({ essential: v, business: v, commerce: v });

export const comparison: { group: string; rows: CompareRow[] }[] = [
  {
    group: "Design",
    rows: [
      { feature: "Custom design, no templates", cells: all(true) },
      { feature: "Mobile-ready", cells: all(true) },
      { feature: "Basic SEO setup", cells: all(true) },
    ],
  },
  {
    group: "Pages",
    rows: [{ feature: "Pages", cells: { essential: "One page", business: "Multi-page", commerce: "Multi-page" } }],
  },
  {
    group: "Features",
    rows: [
      { feature: "Photo gallery", cells: all(true) },
      { feature: "Contact details and links", cells: all(true) },
      { feature: "Contact form", cells: { essential: false, business: true, commerce: true } },
      { feature: "Booking or reservation requests", cells: { essential: false, business: true, commerce: true } },
      { feature: "Online shop", cells: { essential: false, business: false, commerce: true } },
      { feature: "Owner admin area", cells: { essential: false, business: false, commerce: true } },
    ],
  },
  {
    group: "Timeline",
    rows: [
      {
        feature: "Typical timeline",
        cells: { essential: "About 1 week", business: "About 2 to 3 weeks", commerce: "About 3 to 5 weeks" },
      },
    ],
  },
  {
    group: "Starting from",
    rows: [{ feature: "Price", cells: { essential: "MVR 3,500", business: "MVR 7,500", commerce: "MVR 12,500" } }],
  },
];

/* ---------------------------------------------------------------- picker */

export const businessTypes = [
  { id: "cafe", label: "Cafe or restaurant" },
  { id: "stay", label: "Guesthouse or hotel" },
  { id: "tours", label: "Dive center or tour operator" },
  { id: "shop", label: "Shop or retail" },
  { id: "wellness", label: "Salon or gym" },
  { id: "creative", label: "Creative or portfolio" },
  { id: "other", label: "Other" },
] as const;

export type BusinessType = (typeof businessTypes)[number]["id"];

export const featureOptions = [
  { id: "menu", label: "Menu or services" },
  { id: "gallery", label: "Photo gallery" },
  { id: "pages", label: "Several pages (about, team, and so on)" },
  { id: "bookings", label: "Bookings or reservations" },
  { id: "sell", label: "Sell products online" },
  { id: "manage", label: "Manage products and orders myself" },
] as const;

export type Feature = (typeof featureOptions)[number]["id"];

/** Likely features for each kind of business, suggested (never forced) in step 2. */
export const suggestedFeatures: Record<BusinessType, Feature[]> = {
  cafe: ["menu", "gallery"],
  stay: ["gallery", "pages", "bookings"],
  tours: ["gallery", "pages", "bookings"],
  shop: ["gallery", "sell", "manage"],
  wellness: ["menu", "gallery", "bookings"],
  creative: ["gallery", "pages"],
  other: ["menu"],
};

/** The package that fits a set of features, and a short reason why. */
export function recommend(features: Set<Feature>): { id: PackageId; why: string } {
  if (features.has("sell") || features.has("manage")) {
    return {
      id: "commerce",
      why: "You want to sell online, so you need a shop with a catalog, cart and order flow, and an admin area to run it.",
    };
  }
  if (features.has("bookings")) {
    return {
      id: "business",
      why: "Taking booking or reservation requests needs a multi-page site with a request system, which is what Business is for.",
    };
  }
  if (features.has("pages")) {
    return {
      id: "business",
      why: "You need room for several pages to show everything you offer, which is what Business is for.",
    };
  }
  return {
    id: "essential",
    why: "A focused one-page site covers everything you picked, and you can upgrade to Business later.",
  };
}

/* ----------------------------------------------------------------- notes */

export const pricingNotes = [
  "All website prices are starting prices. The final price is quoted based on the size of the project.",
  "Typical timelines are estimates. The actual timeline is quoted for each project.",
  "Hosting and domain fees are quoted separately.",
  "A portion of the payment is taken upfront before work begins, depending on the size of the project.",
];
