export type Concept = {
  slug: string;
  name: string;
  category: string;
  url: string;
};

export const concepts: Concept[] = [
  { slug: "fuku-coffee", name: "Fuku Coffee", category: "Café", url: "https://cafe-nuit.vercel.app" },
  { slug: "driftwood", name: "Driftwood", category: "Guesthouse", url: "https://guesthouse-nuit.vercel.app" },
  { slug: "verum", name: "Verum", category: "Skincare", url: "https://skincare-nuit.vercel.app" },
  { slug: "homestead", name: "Homestead", category: "Furniture", url: "https://furniture-nuit.vercel.app" },
  { slug: "scentu", name: "Scentu", category: "Fragrance", url: "https://perfume-nuit.vercel.app" },
  { slug: "nocturne", name: "Nocturne", category: "Café", url: "https://cafe2-nuit.vercel.app" },
];

export const slideImage = (c: Concept) => `/concepts/${c.slug}/slide.jpg`;
export const previewImages = (c: Concept) =>
  [1, 2, 3].map((n) => `/concepts/${c.slug}/preview-${n}.jpg`);
