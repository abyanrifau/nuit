# Nuit Works

Portfolio site for Nuit Works, a two-person web design and development studio based in the Maldives.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- framer-motion for fade-ups and overlays
- swiper for the concepts coverflow carousel (adapted from Skiper UI Carousel_003)
- lenis for smooth scrolling

## Getting started

```bash
npm install
npm run dev
```

Build for production with `npm run build`. The project deploys to Vercel with no extra configuration.

## Fonts

Only two font files are loaded, both through `next/font/local` in `app/layout.tsx`:

- `app/fonts/AlteHaasGroteskBold.ttf` (wordmark, headings, nav, buttons). The licence lives next to it in `app/fonts/Alte Haas Grotesk licence.rtf` and must stay bundled with the font.
- `app/fonts/HelveticaNeueLight.otf` (all body text, labels, descriptions).

The original zips are kept in `fonts-source/`.

## Concept screenshots

Screenshots for the carousel and preview popup live in `public/concepts/<slug>/`. To regenerate them:

```bash
npx playwright install chromium
node scripts/capture-screenshots.mjs
```

## Structure

- `app/layout.tsx`: fonts, metadata, smooth scroll provider, nav and footer
- `app/page.tsx`: the five sections in order
- `components/`: one file per section plus Nav, Footer, SmoothScroll, FadeUp, ConceptCarousel, ConceptPreview
- `data/concepts.ts`: the six concept sites
- `scripts/capture-screenshots.mjs`: Playwright capture script
