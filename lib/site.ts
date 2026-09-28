/* Studio facts used across the site, metadata and structured data. */

export const SITE_URL = "https://www.nuit.works";
export const SITE_NAME = "Nuit Works";
export const SITE_TITLE = "Nuit Works | Web Design Studio in the Maldives";
export const SITE_DESCRIPTION =
  "Nuit Works is a web design and development studio in the Maldives. We design, build, host and maintain websites that help businesses generate leads.";

export const SITE_KEYWORDS = [
  "web design Maldives",
  "website design Maldives",
  "web development Maldives",
  "website hosting Maldives",
  "website maintenance",
  "business website",
  "generate leads",
  "Nuit Works",
];

export const CONTACT_EMAIL = "hello@nuit.works";
export const INSTAGRAM_HANDLE = "@nuit.works";
export const INSTAGRAM_URL = "https://instagram.com/nuit.works";

export const NAV_LINKS = [
  { label: "work", href: "/work" },
  { label: "services", href: "/services" },
  { label: "pricing", href: "/pricing" },
  { label: "about", href: "/about" },
  { label: "contact", href: "/contact" },
] as const;

/** The businesses the hero line cycles through, in order. */
export const HERO_WORDS = [
  "cafes",
  "resorts",
  "guesthouses",
  "dive centers",
  "creatives",
  "travel agencies",
  "perfume boutiques",
  "restaurants",
  "furniture stores",
  "salons",
  "jewelers",
  "gyms",
];

/** The same line as one plain sentence, for screen readers and search engines. */
export const HERO_SENTENCE = `Websites for ${HERO_WORDS.slice(0, -1).join(", ")} and ${
  HERO_WORDS[HERO_WORDS.length - 1]
}, made in the Maldives.`;
