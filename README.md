# Nuit Works

The website of Nuit Works, a web design and development studio in the Maldives.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 (design tokens live as CSS variables in `app/globals.css`)
- GSAP with ScrollTrigger and SplitText for scroll and text motion, Lenis for smooth scrolling (desktop only)
- ogl for the two WebGL prisms carried over from the previous site, plus a small raw-WebGL light field
- Resend for the contact form
- Playwright, ffmpeg-static and sharp for the concept media capture script (dev only)

## Getting started

```bash
npm install
npm run dev
```

`npm run build` builds for production; `npm run lint` and `npm run typecheck` check the code.

## Where things live

- `app/`: pages (`/`, `/work`, `/work/[slug]`, `/services`, `/pricing`, `/about`, `/contact`), metadata, `sitemap.ts`, `robots.ts`, and the contact form's server action (`app/contact/actions.ts`).
- `data/`: all content. `work.ts` (projects), `pricing.ts` (packages, comparison, notes), `studio.ts` (services, pillars, process), `faq.ts`, `team.ts` (hidden team section).
- `lib/`: site facts (`site.ts`), the motion system (`motion.ts`, `gsap.ts`), the light moods (`light.ts`), structured data and metadata helpers.
- `components/`: `layout/` (nav, footer, loading screen, page hero), `home/` (homepage sections), `work/` and `case/` (work index and case studies), `pricing/`, `contact/`, `prism/`, `light/`, `cursor/`, `transition/` (TransitionLink and the fade page transition), `motion/` (RevealText, Reveal), `ui/` (Button, TextLink, icons).

## The motion system

- One easing curve for arrivals (`expo.out` / `--ease-out`) and one for swaps (`expo.inOut` / `--ease-in-out`), with a short timing scale in `lib/motion.ts`.
- Signature pieces only: the loading screen (first visit per session, gone within about 3 seconds, click or key to skip), a clean fade between pages (250ms out, 400ms in, always from the top), the custom cursor (fine pointers only), and headings that fade in line by line from a slight blur.
- Hover is kept minimal: nav links and buttons roll their label; text links redraw their underline. A thin line at the top of the page shows scroll progress in place of the scrollbar.
- The light field (`components/light/LightField.tsx`) is one fixed layer. Each section sets its mood with `data-light="..."`; moods are defined in `lib/light.ts`.
- `prefers-reduced-motion` turns off smooth scroll, reveals, the cursor, pinning, the loading screen animation and all WebGL motion; content is always visible.

## Adding a project

1. Add the slug and live URL to `data/concept-sources.ts`.
2. Capture its media (videos, posters, screenshots, type specimens, design system):
   ```bash
   npx playwright install chromium
   npm run capture -- <slug>
   ```
   Files land in `public/work/<slug>/`; the extracted fonts and colours are written to `scripts/output/<slug>.json`.
3. Add an entry to `data/work.ts`, using the report to fill in fonts, palette and file names. Set `kind: "Client"` for real client work; concepts stay `"Concept"`.

`npm run capture` with no slug re-captures everything. Use `--no-video` for stills only or `--video-only` for recordings only.

## Contact form

The form posts to a server action that emails `hello@nuit.works` through Resend. Without `RESEND_API_KEY` it tells the visitor the form isn't connected and offers a ready-written email instead, so no enquiry is lost.

Setup:

1. Create a free account at [resend.com](https://resend.com).
2. In Resend, go to **Domains**, add `nuit.works`, and add the DNS records it shows (SPF, DKIM and the optional return-path record) at your domain registrar. Wait for it to show as verified.
3. In Resend, go to **API Keys** and create a key with "Sending access".
4. In Vercel, open the project, go to **Settings > Environment Variables**, and add for Production (and Preview if you like):
   - `RESEND_API_KEY`: the key from step 3
   - `CONTACT_FROM_EMAIL`: `Nuit Works website <website@nuit.works>` (any address on the verified domain)
   - `CONTACT_TO_EMAIL`: optional, defaults to `hello@nuit.works`
5. Redeploy so the new variables are picked up.

Before the domain is verified you can test with only `RESEND_API_KEY` set: Resend's test sender will deliver, but only to the email address on your Resend account.

Spam protection: a hidden honeypot field and a minimum time on the page before sending. Replies go straight to the visitor (the email's reply-to is their address).

## Deploying

Import the folder into Vercel as a Next.js project (no extra configuration). Point `nuit.works` and `www.nuit.works` at it in **Settings > Domains**; the canonical host is `https://www.nuit.works`. Vercel Web Analytics is included (enable it in the Vercel dashboard).

## Credits and licences

- Fonts: Alte Haas Grotesk (Yann Le Coroller, freeware; its licence file must stay with the font in `app/fonts/`) and Helvetica Neue Light. The original zips are in `fonts-source/`.
- The hero prism shader is adapted from [React Bits](https://reactbits.dev) (MIT), as on the previous site.
