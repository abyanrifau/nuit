# Round 7 optimization log

Running log for round 7 (loader, mobile scrolling, performance, SEO, GEO).
Newest entries at the bottom of each section. Scores are Lighthouse medians
of 3 runs against a local production build (`next build` + `next start`).

## Setup

- The project folder was not a git repository. Decision: ran `git init`,
  committed the site exactly as it stood after round 6 to `main` as the
  baseline ("Baseline: site as of round 6"), then created the branch
  `round-7-loader-mobile-performance`. All round 7 work is committed on that
  branch; `main` is untouched. Nothing is pushed anywhere (there is no
  remote) and nothing is deployed.
- Local git config for this repo only: `core.autocrlf=false` (the files are
  LF; this avoids line-ending churn on Windows) and a commit identity of
  "Nuit Works <abyanalirifau@gmail.com>".
- Stack notes that differ from the brief: the site uses `ogl` (a ~30KB WebGL
  library) for both prisms and a hand-written WebGL light field. There is no
  three.js, @react-three/fiber or drei in the project, so the three.js items
  in the brief are covered by checking that the ogl prisms are code-split and
  load only where they appear.
- `components/about/TeamSection.tsx` and `data/team.ts` are a deliberate,
  switched-off placeholder (renders nothing until real people are added and
  `SHOW_TEAM` is true). Kept as is.

## Decisions made without asking

(Also repeated in OPTIMIZATION_REPORT.md.)

1. Initialised git and made the round 6 state the baseline commit on `main`.

## Part 1: loader (analysis)

Read through `components/layout/Loader.tsx`, the head script, the CSS states
and everything that listens to `data-loader`. The loader is a server-rendered
overlay driven by a small inline script (not React state), so React Strict
Mode, re-renders, Suspense and the page fade cannot unmount or restart it,
and GSAP/ScrollTrigger/Lenis never touch it. The real causes of early exits:

1. **Any tap, click or key press skipped it.** The script listened for
   `pointerdown` and `keydown` on the window (capture phase) and jumped
   straight to a 0.35s exit. On phones the first touch of a scroll attempt
   is a `pointerdown`, so simply trying to scroll ended the loader. This is
   the main cause of "it gets cut off and the site opens".
2. **The "seen" flag was set when the loader started**, in the head script.
   A reload (or a remount of the document) during the animation therefore
   skipped the loader entirely on the next load.
3. **The last-resort timer (10s in `<head>`) could fire during a legitimate
   slow finish**: with an 8s safety, a 0.4s hold and a 0.8s exit, a slow
   load could still be lifting at 9.2s+, close enough to the 10s cutoff to
   collide on a slow device.
4. **Nothing locked scrolling.** The page could scroll underneath (and on
   desktop Lenis scrolls by script, which `overflow: hidden` alone does not
   stop), so the hero could be scrolled away before the reveal.
5. The count's finishing phase was time-boxed to 0.6s from whenever loading
   completed, so a late "ready" could make the last stretch feel rushed.

## Part 1: loader (changes)

- Removed the click / key skip entirely.
- New timeline: the count runs on a fixed 1.95s curve (quick start, slowing
  toward 100). The exit only starts when that timeline has reached 100 AND
  the site is ready (load event, all fonts, background light and hero prism
  fully drawn). While the site is still loading, the count follows a
  ceiling that eases from 88 toward 99 (it slows and waits, never stops
  dead), then glides to 100 over 0.7s once ready. A light follower smooths
  every change of pace, so the count can never jump.
- Minimum: the cover stays at least 2.5s. Hold at 100: 0.4s. Exit: 0.8s.
- Safety: at 8s the site is treated as ready and the sequence still finishes
  normally (glide to 100, hold, exit). The head-script last resort moved to
  12s and only acts if the inline script never ran.
- The "seen" flag is written only when the exit has completed.
- Scroll lock: `html[data-scroll-lock]` (set by the head script before first
  paint, removed after the exit) sets `overflow: hidden`; Lenis is paused
  while it is present (and page transitions cannot restart it); the overlay
  has `touch-action: none` so swipes on it go nowhere.

2. Raw Lighthouse reports (JSON and HTML, 1 to 3MB each) are saved under
   `reports/before/` and `reports/after/` on disk but ignored by git, to keep
   the repository small; the score summaries (`summary.json` and the tables
   in this log) are committed.

## Baseline (before)

Lighthouse 13.5 against the round 6 production build (`next build` +
`next start` on port 3100), median of 3 runs per page and preset. Raw reports
in `reports/before/`; the table is also in `reports/before/scores.md`.

| Page | Mobile P / A / BP / SEO | Desktop P / A / BP / SEO | Mobile FCP / LCP / TBT / CLS / SI | Desktop LCP / TBT / CLS |
|---|---|---|---|---|
| / | 90 / 96 / 96 / 100 | 100 / 96 / 96 / 100 | 0.98s / 3.49s / 134ms / 0.000 / 1.41s | 0.69s / 23ms / 0.000 |
| /work | 89 / 100 / 96 / 100 | 100 / 100 / 96 / 100 | 0.97s / 3.77s / 74ms / 0.000 / 1.34s | 0.73s / 51ms / 0.000 |
| /work/driftwood | 87 / 100 / 96 / 100 | 95 / 100 / 96 / 100 | 0.97s / 3.81s / 168ms / 0.000 / 1.44s | 0.92s / 169ms / 0.000 |
| /work/scentu | 88 / 100 / 96 / 100 | 97 / 100 / 96 / 100 | 0.98s / 3.76s / 123ms / 0.000 / 1.44s | 0.90s / 126ms / 0.000 |
| /work/verum | 84 / 100 / 96 / 100 | 95 / 100 / 96 / 100 | 0.97s / 3.88s / 247ms / 0.000 / 1.48s | 0.92s / 162ms / 0.000 |
| /work/nocturne | 85 / 100 / 96 / 100 | 98 / 100 / 96 / 100 | 0.98s / 3.79s / 236ms / 0.000 / 1.48s | 0.90s / 119ms / 0.000 |
| /work/fuku-coffee | 83 / 100 / 96 / 100 | 96 / 100 / 96 / 100 | 0.97s / 3.90s / 261ms / 0.000 / 1.53s | 0.90s / 145ms / 0.000 |
| /work/homestead | 81 / 100 / 96 / 100 | 97 / 100 / 96 / 100 | 0.99s / 3.92s / 319ms / 0.000 / 1.53s | 0.90s / 128ms / 0.000 |
| /services | 93 / 96 / 96 / 100 | 99 / 96 / 96 / 100 | 0.96s / 3.16s / 103ms / 0.000 / 1.23s | 0.68s / 107ms / 0.000 |
| /pricing | 92 / 100 / 96 / 100 | 99 / 100 / 96 / 100 | 0.97s / 3.31s / 84ms / 0.000 / 1.35s | 0.71s / 65ms / 0.000 |
| /about | 93 / 96 / 96 / 100 | 100 / 96 / 96 / 100 | 0.97s / 3.16s / 93ms / 0.000 / 1.27s | 0.68s / 50ms / 0.000 |
| /contact | 94 / 97 / 96 / 100 | 100 / 97 / 96 / 100 | 0.93s / 3.16s / 63ms / 0.000 / 1.08s | 0.69s / 46ms / 0.000 |

The 404 page cannot be scored: Lighthouse (like PageSpeed Insights) refuses any page that returns a 404 status, which the 404 page correctly does.

What the baseline shows:

- **Performance (mobile, 81 to 94):** the only weak metric is LCP (3.2 to
  3.9s simulated). The observed load is fast (LCP actually paints at about
  0.17s), but locally every script arrives and runs before the first paint,
  so Lighthouse's throttled simulation charges all of that JavaScript to
  LCP. Case studies are worst: their scroll recordings were preloading about
  2MB of video during page load, their LCP element was a 1280px video poster
  shown at 370px, and hydration costs 120 to 320ms of TBT.
- **Accessibility (96 to 97 on home, services, about, contact):** only
  `color-contrast`, on the process steps that rest at 35% opacity (the
  round 1 design) and, on contact, see the contact notes in the after table.
- **Best Practices (96 everywhere):** only `errors-in-console`: the Vercel
  Analytics script 404s when the site is not running on Vercel.
- **SEO: 100 everywhere.**

## Part 1: loader (test results)

Test: `loadertest.mjs` (Playwright, production build, fresh browser context
per load so every load is a first visit). Each load logs the stage and count
every frame, and tries to end or scroll the loader (clicks, Space and arrow
keys, mouse wheel on desktop; taps and vertical swipes on touch).

- Against the round 6 build: 0 of 6 loads played in full. The first
  click/tap ended the loader after about 0.9s, the "seen" flag was already
  set at 0.1s, and a reload during the loader skipped it completely.
- First pass of the new loader: two real problems found and fixed. (1) The
  0.4s hold could shrink to a few ms when the main thread was blocked right
  after 100 (the timer was scheduled before 100 was painted); the hold now
  starts two frames after 100 is on screen. (2) During the app's startup
  work a dropped frame could make the count skip 12 to 19 numbers; the count
  now advances at most 3 per frame and catches up smoothly.
- Final: **90 of 90 loads passed** (10 each: 1440 normal, 390 normal, 1440
  Fast 3G, 390 Fast 3G, 1440 cache disabled, 390 cache disabled, direct to
  /pricing, direct to /work/driftwood on a phone, and a reload one second
  into the loader). Every load: stages in order, count monotonic with a
  largest step of 2 or 3, 100 only after the site was ready, hold >= 0.4s,
  exit >= 0.8s, cover shown >= 2.5s, page never scrolled, flag set only at
  the end. Typical timings (from navigation start): phone, normal: 100 at
  2.0s, exit starts 2.6s, gone 3.4s. Desktop, normal: 100 at 2.3s, gone about
  4.0s (the hold stretches while the test browser compiles the prism shader
  in software; real GPUs do this in milliseconds). Fast 3G: 100 at 4.6 to
  5.7s, gone 5.9 to 7.0s.

## Part 2: mobile sideways movement

Test: `overflow.mjs` on every page at 360x780, 390x844, 430x932 and
768x1024 with touch emulation: `scrollWidth` vs viewport width at several
scroll positions, a list of any unclipped element past the right edge,
sideways drags, a pinch-out, and on the home page a sideways swipe on the
gallery plus a vertical swipe over it.

- In Chromium's emulation the round 6 build already measured clean at these
  sizes (the earlier rounds had fixed the pricing card glow and the hero
  canvas). On desktop, the work gallery's pinned track made the document
  6,425px wide (a trackpad could scroll the page sideways).
- The likely cause on real phones is Safari: every wide decorative layer
  (hero prism canvas and still frame, process glow, pricing card glow) is
  contained with `overflow-x: clip`, which Safari only supports from 16.0.
  On older iPhones those declarations are ignored, the ~1,300px prism layer
  widens the page, and the page can be dragged sideways and zoomed out.
  Safari also lets a page pan sideways when anything pokes out, and the
  case-study page strip did not contain its horizontal overscroll.

Changes:
- Work gallery section clipped horizontally (`overflow-x-clip`); its pinned
  track sits in a fixed layer while pinned, which clipping does not affect.
- `overflow-x: clip` on `html` and `body` as the safety net.
- `@supports not (overflow: clip)` fallback: `html`, `body` and every
  `overflow-x-clip` element use `overflow-x: hidden` instead.
- `touch-action: pan-y pinch-zoom` on the page: the browser only ever pans
  it vertically (pinch zoom stays available). The gallery and the page strip
  are scroll containers of their own, so their sideways swipes still work.
- `overscroll-x-contain` on the case-study page strip (the gallery already
  had it), so reaching its end never drags the page.
- Viewport meta was already `width=device-width, initial-scale=1` with pinch
  zoom allowed; unchanged. Lenis was already off on touch devices.

Result: every page at every size: `scrollWidth` equals the viewport width,
no unclipped element past the edge, sideways drags do not move the page,
pinch-out cannot zoom out beyond the screen width, and the gallery (and the
case-study page strip) still swipe sideways within themselves while vertical
swipes over them scroll the page.

## Part 3: tooling notes

- There is no Vercel CLI or PageSpeed Insights API key on this machine and
  the brief rules out deploying, so every score here is Lighthouse 13.5 run
  locally (`npx lighthouse`, default mobile throttling and the desktop
  preset) against `next build` + `next start`. PSI runs the same Lighthouse
  with the same simulated throttling, so these are close proxies, but a real
  network will shift LCP (see Part 3 findings).
- Bundle analysis uses Next's built-in Turbopack analyzer (`npm run
  analyze`, which runs `next experimental-analyze`). `@next/bundle-analyzer`
  only works with webpack builds, and this project builds with Turbopack.
- This machine is noisy (other heavy apps were running), so the same build
  could score 3 to 5 points apart across an hour. Every keep/revert decision
  below was made from back-to-back runs (median of 5) against a `main` build
  measured in the same session, never against the morning's baseline.
- Iteration summaries are committed in `reports/iterations/<name>/summary.json`
  (raw reports stay on disk, ignored by git).

## Part 3: what the bundle and traces showed

- Shared JS on every page: about 188KB gzipped. React + Next about 131KB,
  GSAP + ScrollTrigger about 44KB, the site shell about 13KB. Page-only JS is
  small: pricing 15KB, home 15KB, work 11KB, about 9KB, case study 8KB,
  services and contact 4KB. ogl and both prisms were already split out and
  load only on the pages that show them.
- On mobile the only weak metric is LCP (3.2 to 3.9s simulated) plus TBT on
  case studies. The observed page paints almost at once; locally every
  script arrives within 40ms, so the first paint waits for hydration, and
  Lighthouse's simulation then charges every request and CPU task before
  that paint to LCP. Changing CSS (grain, blur, the loader, a stand-in hero)
  did not move the observed first paint (184 to 196ms in every variant), so
  the lever is startup JavaScript, not styling.
- npm audit: 0 vulnerabilities.

## Part 3: changes kept

Performance
- Case-study recordings download nothing during page load: sources are only
  attached when the video is near the screen AND the page has loaded, the
  loader has lifted and the browser is idle (`usePageSettled`). Posters are
  `next/image` with per-use `sizes`, so a phone gets a ~400px poster instead
  of the 1280px original. (Case studies were preloading about 2MB of video.)
- SplitText is fetched on first use and warmed when the page goes idle,
  instead of being in the startup bundle.
- Lenis is fetched only on mouse devices (it was already disabled on touch;
  now phones never download it either).
- Reveal blocks still hide at hydration exactly as before, but create their
  ScrollTrigger only when within one screen of view, which removes most of
  the layout reads from hydration.
- Links prefetch on intent (hover, touch start, keyboard focus) instead of on
  sight; the 250ms page fade covers any late prefetch.
- Favicons and manifest icons recompressed losslessly (identical pixels,
  about half the bytes).
- The 12 full-page concept captures (3.3MB, never shown on the site) moved
  out of `public/` into `scripts/output/`.
- Unused icons and an unused easing constant removed.
- One-year immutable cache for captured concept media and the hero stills.
- Measured back to back against main (mobile, median of 5): home TBT 233 to
  76ms, verum TBT 201 to 102ms; performance home 87 to 90, verum 85 to 89.

Best practices
- Security headers on every response: HSTS, nosniff, Referrer-Policy,
  X-Frame-Options, COOP, Permissions-Policy, and in production a
  Content-Security-Policy that allows exactly what the site loads (all
  same-origin; inline scripts for Next's bootstrap, the loader and JSON-LD).
- `x-powered-by` removed.
- Vercel Analytics renders only in Vercel builds. Its script 404s anywhere
  else, which was the only Best Practices failure (96 to 100). On Vercel it
  behaves exactly as before.
- Web manifest with 192px and 512px icons.

SEO and GEO
- Per-page Open Graph images in the site's own style, generated by
  `scripts/og-images.mjs`; each case study's image is tagged "Concept". The
  home share image re-encoded at 1200x630 (139KB to 35KB).
- Structured data: Organization + ProfessionalService (services described,
  area served), WebSite, BreadcrumbList on inner pages, OfferCatalog with
  starting prices in MVR ("Starting price: from ...", hosting "per month"),
  Service on services, FAQPage on pricing, and CreativeWork on case studies
  that states "a concept website ... not a client project". No reviews,
  ratings or awards anywhere.
- FAQ answers rewritten to stand alone, with new questions on what each
  package includes, which businesses we work with, upgrading later and what
  a website costs in the Maldives.
- `llms.txt` gains a "who we work with" section and links; a generated
  `/llms-full.txt` holds the full services, process, packages, plans, notes,
  FAQs, work (as concepts) and contact details.
- robots.txt also allows Claude-SearchBot (all AI crawlers allowed).
- Meta descriptions are 140 to 160 characters on every page; case studies
  fit theirs automatically; titles follow "Page | Nuit Works" and stay under
  60 characters; the homepage title is unchanged.
- The 404 page links to the main pages, is `noindex`, and names no canonical.

## Part 3: tried and reverted

- Reverting the video change for an A/B check (ab-novideo) showed no score
  difference on its own under the noisy conditions; kept anyway because it
  removes ~2MB of downloads during page load on case studies.
- Letting `next/image` lazy-load gallery posters on its own: the browser's
  lazy threshold fetched all gallery posters during load. Went back to
  attaching posters only when near.
- Stand-in hero, removing the grain, removing the blur or the loader from
  first paint (experiments only, never committed): no change to first paint
  or the simulated LCP, so none of these features were touched.

## Decisions made without asking (continued)

3. Kept the inactive process steps at 35% opacity (the design). They are the
   only accessibility failure (contrast 2.98:1 on home, services and about,
   score 96). Raising them is listed as an option in the report, not applied.
4. Did not add `@next/bundle-analyzer` (webpack only); used the built-in
   Turbopack analyzer instead.
5. Moved the full-page concept captures out of `public/` (not used by the
   site; still kept in the repo for reference).
6. Vercel Analytics only rendered on Vercel (no change in production).
7. Case-study meta descriptions add "Not a client project." when the summary
   is short, which both reaches 140 characters and keeps concepts labelled.
8. Iteration reports grouped under `reports/iterations/` with only their
   summaries committed.
