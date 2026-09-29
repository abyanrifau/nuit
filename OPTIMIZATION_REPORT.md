# Round 7 report: loader, mobile scrolling, performance, SEO and GEO

Branch: `round-7-loader-mobile-performance` (not pushed, not deployed; `main`
is the untouched round 6 baseline). The step-by-step working notes are in
`OPTIMIZATION_LOG.md`. Scores are Lighthouse 13.5 (the engine behind
PageSpeed Insights) against a local production build, median of 3 runs.

## 1. Loader: why it was cut short, and the fix

The loader is a server-rendered overlay run by a small inline script, so
React re-renders, Strict Mode, Suspense and the page fade were never the
problem. There were five causes:

1. **Any tap, click or key press skipped it.** The script ended the loader on
   the first `pointerdown` or `keydown`. On a phone, the first touch of a
   scroll is a `pointerdown`, so just trying to scroll ended it after about
   0.9s. This was the main cause.
2. **The "already seen" flag was set when the loader started**, so reloading
   during the animation skipped the loader completely.
3. **A 10s last-resort timer could cut into a slow but legitimate finish**
   (8s safety + 0.4s hold + 0.8s exit gets close to 10s).
4. **Scrolling was not locked.** The page (and Lenis on desktop) could scroll
   underneath, so the hero could be scrolled away before the reveal.
5. **The last stretch was squeezed into 0.6s** from whenever loading ended,
   so a late load made the finish look rushed.

The fix (in `components/layout/Loader.tsx` and `app/globals.css`):

- No skip on click, tap or key.
- The letters, then the line and count, run on a fixed timeline. The exit
  starts only when the count has reached 100 **and** the site is ready (page
  load, all fonts, background light and the hero prism fully drawn).
- While the site is still loading, the count slows toward 99 without ever
  stopping dead. Once the site is ready it glides to 100 in 0.7s. It never
  jumps (at most 3 per frame).
- Hold at 100 for 0.4s, counted from when 100 is actually on screen. Exit
  takes 0.8s. The cover stays at least 2.5s in total.
- At 8s the site counts as ready and the sequence still finishes the same
  way. The head-script last resort moved to 12s and only acts if the loader
  script never ran.
- The "seen" flag is written only after the exit completes.
- Scrolling is locked from the first paint until the exit ends: `overflow:
  hidden` on the page, Lenis paused, and `touch-action: none` on the overlay.

Result: **90 of 90 fresh loads played the full sequence.** That is 10 each at
1440 and 390 on a normal connection, Fast 3G and with the cache disabled,
plus direct loads of /pricing and a case study, and a reload mid-loader.
Every load was tested while clicking, tapping, swiping, scrolling and
pressing keys. Timings on the final build (seconds from navigation start):

| Test | 100 reached | Exit starts | Loader gone |
|---|---|---|---|
| Phone 390, normal | 1.97 to 2.01 | 2.58 to 2.60 | 3.41 to 3.44 |
| Desktop 1440, normal | 2.27 to 2.80 | 2.75 to 3.24 | 3.58 to 4.05 |
| Phone 390, Fast 3G | 4.61 to 5.42 | 5.05 to 5.86 | 5.86 to 6.67 |
| Desktop 1440, Fast 3G | 5.26 to 6.13 | 5.69 to 6.57 | 6.51 to 7.38 |
| Phone 390, cache disabled | 1.95 to 1.99 | 2.57 to 2.60 | 3.39 to 3.42 |
| Desktop 1440, cache disabled | 2.13 to 2.65 | 2.86 to 3.38 | 3.73 to 4.41 |
| /pricing direct, 1440 | 1.96 to 2.00 | 2.58 to 2.60 | 3.40 to 3.41 |
| Case study direct, 390 | 1.97 to 2.00 | 2.58 to 2.60 | 3.38 to 3.42 |
| Reload during loader, 1440 | 3.05 to 3.52 | 3.56 to 4.00 | 4.43 to 4.84 |

On desktop, the extra time is the test browser drawing the hero prism in
software; a real graphics card does this almost instantly.

## 2. Mobile sideways movement: what overflowed, and the fix

Every page was tested at 360x780, 390x844, 430x932 and 768x1024 with touch
emulation. The checks were page width against screen width at several scroll
positions, sideways drags, pinch-out, and swipes on the work gallery.

What was found:

- **Work gallery (home):** on desktop its pinned sideways track made the
  whole document 6,425px wide, so a trackpad could scroll the page sideways.
- **Safari before 16 (older iPhones):** every wide decorative layer is
  clipped with `overflow-x: clip`, which these versions ignore. That covers
  the hero prism canvas and its still frame (about 1,300px wide on a phone),
  the process glow and the pricing card glow. On those phones the prism
  layer widens the page, so it can be dragged sideways and zoomed out. In
  Chromium these layers were already contained, which is why the emulated
  sizes measured clean even before the fix.
- **Case-study page strip:** reaching the end of its sideways scroll could
  hand the swipe on to the page.

The fixes:

- The work gallery section clips horizontally, so its track stays wide
  inside its own section.
- `overflow-x: clip` on `html` and `body` as the safety net. Unlike `hidden`,
  `clip` keeps sticky and pinned sections working.
- Where `clip` is not supported, `html`, `body` and every clipped section
  fall back to `overflow-x: hidden`.
- `touch-action: pan-y pinch-zoom` on the page. The browser only pans it
  vertically, and pinch zoom still works.
- `overscroll-x-contain` on the case-study page strip. The gallery already
  had it.
- The viewport meta was already `width=device-width, initial-scale=1`, with
  zoom allowed, so it is unchanged. Lenis is off on touch devices (and phones
  no longer download it).

Result on the final build: at every page and size, the page width equals the
screen width. Sideways drags do not move the page, and a pinch-out cannot
make it wider than the screen. The gallery still swipes sideways within its
own section (track moved 0 to 275px at 360 wide, 0 to 555px at 430 wide),
and a vertical swipe over it still scrolls the page. The case-study strip
swipes too.

## 3. Scores before and after

How these were measured: Lighthouse 13.5 on this machine, against production builds of `main` ("before", the round 6 site) and this branch ("after"). Both were served side by side and measured **alternately, page by page**, with 3 rounds per page and preset; each cell is the median run. This machine was busy (a game and other apps were running), so the same build scored 3 to 5 points differently from hour to hour. Alternating runs means both builds see the same noise, which makes this the fair comparison. The morning's baseline (`reports/before/scores.md`) was taken on a quieter machine, so its absolute numbers are a few points higher on mobile than anything measured later, for both builds.

Scores (Performance / Accessibility / Best Practices / SEO):

| Page | Mobile P / A / BP / SEO, before | Mobile, after | Desktop P / A / BP / SEO, before | Desktop, after |
|---|---|---|---|---|
| / | 88 / 96 / 96 / 100 | **89 / 96 / 100 / 100** | 100 / 96 / 96 / 100 | **100 / 96 / 100 / 100** |
| /work | 86 / 100 / 96 / 100 | **89 / 100 / 100 / 100** | 100 / 100 / 96 / 100 | **99 / 100 / 100 / 100** |
| /work/driftwood | 82 / 100 / 96 / 100 | **85 / 100 / 100 / 100** | 96 / 100 / 96 / 100 | **99 / 100 / 100 / 100** |
| /work/scentu | 83 / 100 / 96 / 100 | **82 / 100 / 100 / 100** | 97 / 100 / 96 / 100 | **99 / 100 / 100 / 100** |
| /work/verum | 81 / 100 / 96 / 100 | **88 / 100 / 100 / 100** | 96 / 100 / 96 / 100 | **100 / 100 / 100 / 100** |
| /work/nocturne | 86 / 100 / 96 / 100 | **86 / 100 / 100 / 100** | 96 / 100 / 96 / 100 | **99 / 100 / 100 / 100** |
| /work/fuku-coffee | 81 / 100 / 96 / 100 | **84 / 100 / 100 / 100** | 95 / 100 / 96 / 100 | **100 / 100 / 100 / 100** |
| /work/homestead | 82 / 100 / 96 / 100 | **86 / 100 / 100 / 100** | 96 / 100 / 96 / 100 | **98 / 100 / 100 / 100** |
| /services | 88 / 96 / 96 / 100 | **89 / 96 / 100 / 100** | 100 / 96 / 96 / 100 | **99 / 96 / 100 / 100** |
| /pricing | 89 / 100 / 96 / 100 | **88 / 100 / 100 / 100** | 99 / 100 / 96 / 100 | **98 / 100 / 100 / 100** |
| /about | 92 / 96 / 96 / 100 | **91 / 96 / 100 / 100** | 100 / 96 / 96 / 100 | **100 / 96 / 100 / 100** |
| /contact | 91 / 100 / 96 / 100 | **90 / 100 / 100 / 100** | 99 / 100 / 96 / 100 | **100 / 100 / 100 / 100** |

Core Web Vitals and supporting metrics (lab, median run). LCP / TBT / CLS; mobile also FCP and Speed Index.

| Page | Mobile FCP | Mobile LCP | Mobile TBT | Mobile CLS | Mobile SI | Desktop LCP | Desktop TBT | Desktop CLS |
|---|---|---|---|---|---|---|---|---|
| / | 0.99s | 3.18s → 3.22s | 271ms → 246ms | 0.000 | 1.49s → 1.47s | 0.71s → 0.74s | 60ms → 44ms | 0.000 |
| /work | 0.98s → 0.97s | 3.84s → 3.65s | 165ms → 93ms | 0.000 | 1.43s | 0.73s → 0.78s | 52ms → 68ms | 0.000 |
| /work/driftwood | 0.98s → 1.00s | 3.92s → 3.68s | 295ms → 244ms | 0.000 | 1.53s → 1.49s | 0.92s → 0.75s | 153ms → 89ms | 0.000 |
| /work/scentu | 0.99s → 0.98s | 3.81s → 3.48s | 273ms → 367ms | 0.000 | 1.52s → 1.35s | 0.90s → 0.77s | 136ms → 71ms | 0.000 |
| /work/verum | 0.98s | 3.91s → 3.61s | 312ms → 172ms | 0.000 | 1.53s → 1.46s | 0.91s → 0.75s | 149ms → 36ms | 0.000 |
| /work/nocturne | 0.98s → 0.99s | 3.76s → 3.52s | 208ms → 251ms | 0.000 | 1.46s → 1.44s | 0.90s → 0.74s | 143ms → 65ms | 0.000 |
| /work/fuku-coffee | 0.99s → 1.00s | 3.94s → 3.72s | 296ms → 265ms | 0.000 | 1.55s → 1.58s | 0.90s → 0.77s | 161ms → 53ms | 0.000 |
| /work/homestead | 0.98s → 0.99s | 3.90s → 3.52s | 293ms → 239ms | 0.000 | 1.54s → 1.41s | 0.90s → 0.77s | 146ms → 118ms | 0.000 |
| /services | 0.98s → 0.99s | 3.17s → 3.21s | 261ms → 231ms | 0.000 | 1.31s → 1.37s | 0.65s → 0.70s | 33ms → 76ms | 0.000 |
| /pricing | 1.00s → 0.99s | 3.34s → 3.38s | 189ms → 203ms | 0.000 | 1.44s → 1.36s | 0.71s → 0.74s | 71ms → 123ms | 0.000 |
| /about | 0.97s → 0.98s | 3.17s → 3.16s | 133ms → 167ms | 0.000 | 1.35s → 1.29s | 0.69s → 0.73s | 40ms → 57ms | 0.000 |
| /contact | 0.95s → 0.94s | 3.16s → 3.22s | 191ms | 0.000 | 1.15s → 1.09s | 0.69s | 66ms → 25ms | 0.000 |

Average performance: mobile 85.8 → 87.3, desktop 97.8 → 99.3.

The 404 page can't be scored. Lighthouse and PageSpeed Insights both refuse a page that returns a 404 status, which this page correctly does. Its HTML, links, `noindex` and missing canonical were checked directly.

What changed, in short:

- **Best Practices: 96 to 100 on every page.** The only failure was a console error from Vercel Analytics, which 404s outside Vercel.
- **Case studies:** desktop went from 95 to 97 up to 98 to 100, with LCP down from about 0.9s to 0.75s and TBT roughly halved. On mobile, the lab LCP is 0.2 to 0.4s lower on every case study. Scores are up by 3 to 7 on four of them, level on Nocturne, and 1 lower on Scentu, where one slow TBT run landed in the median. No video downloads during page load any more.
- **Home and the simpler pages:** level with before, within the noise (plus or minus 1).
- **CLS is 0 everywhere, before and after. FCP is unchanged** at about 1.0s mobile and 0.26s desktop.
- **Pricing on desktop** has somewhat more TBT (about 120ms vs 70ms). It now carries 10 FAQ answers instead of 7, plus larger structured data, so there is more to hydrate. It still scores 98.

**About the mobile LCP:** Lighthouse reports about 3.2 to 3.7s, but in the traces the page's LCP is actually painted at about 0.14s on both builds. Lighthouse's mobile simulation (slow 4G, 4x slower CPU) instead estimates LCP from every request and every task that happened before that paint. Here that is the framework's startup JavaScript, which locally all arrives before the first paint. PageSpeed Insights runs the same simulation, so expect similar numbers there, give or take a few points for real network timing.

Raw reports for the final build are in `reports/after/lighthouse/` (HTML and JSON on disk, summary committed). That run was a separate, non-alternating one, so its numbers wobble with the machine; the table above is the one to compare.

## 4. All changes, grouped

**Loader** (see section 1)
- Full sequence always plays; no skip; exit only at 100 and ready; 2.5s
  minimum; 0.4s hold; 0.8s exit; 8s safety that still finishes smoothly;
  scroll locked; seen-flag set only at the end.

**Mobile** (see section 2)
- Gallery clipped in its section; `overflow-x: clip` on html and body with a
  `hidden` fallback; vertical-only page panning with pinch zoom kept; page
  strip overscroll contained.

**Performance**
- Case-study recordings: no video bytes during page load. Videos attach only
  when near the screen and after the page has loaded, the loader has lifted
  and the browser is idle. Case studies had been preloading about 2MB.
- Video posters are responsive images (`next/image` with per-use sizes), so a
  phone downloads a ~400px poster instead of the 1280px original.
- SplitText is loaded on first use (and warmed when idle) instead of at
  startup.
- Lenis is loaded only on mouse devices.
- Links prefetch on intent (hover, touch, focus) instead of as soon as they
  are visible.
- Icons recompressed losslessly (identical pixels, about half the size).
- One-year immutable browser cache for concept media and hero stills.
- 3.3MB of unused full-page captures moved out of `public/`.
- Unused code removed (three icons, one easing constant).
- `npm run analyze` added (Next's built-in bundle analyzer).

**Best practices and security**
- Headers: HSTS and nosniff on every response. Pages also get
  Referrer-Policy, X-Frame-Options, Cross-Origin-Opener-Policy,
  Permissions-Policy, and a production Content-Security-Policy that allows
  only the site's own origin. Scripts, fonts and images don't need those,
  so they don't carry them (about 0.8KB less per response).
- `x-powered-by` header removed.
- Vercel Analytics renders only on Vercel. It 404s anywhere else, which was
  the only console error and cost 4 Best Practices points. It is unchanged on
  the live site.
- Web manifest with 192px and 512px icons.

**SEO**
- Every page has a "Page | Nuit Works" title under 60 characters. The home
  title is unchanged.
- Every meta description is 140 to 160 characters. Case studies fit theirs
  automatically.
- Canonical URLs on `https://www.nuit.works`. The 404 page is `noindex`, has
  no canonical and links to the main pages.
- Open Graph and Twitter images for every page, generated in the site's style
  by `scripts/og-images.mjs`. Case-study images say "Concept".
- The sitemap (12 URLs with lastmod) and robots.txt were checked; all
  content is in the server HTML.

**Structured data**
- Organization + ProfessionalService, with services described and the area
  served.
- WebSite on every page, and BreadcrumbList on inner pages.
- An OfferCatalog with starting prices in MVR ("Starting price: from ...")
  and hosting per month.
- Service on the services page and FAQPage on pricing.
- CreativeWork on case studies, marked as a concept website and not a
  client project.
- No reviews, ratings, stats or awards anywhere.

**GEO**
- FAQ answers rewritten to stand on their own, with new questions on package
  contents, the businesses we work with, upgrading and website cost in the
  Maldives.
- `llms.txt` extended, and a new `/llms-full.txt` generated from the site's
  own data.
- robots.txt allows the AI crawlers, now including Claude-SearchBot.
- Name, email and Instagram are the same everywhere.

**Tried and reverted** (details in the log)
- Creating Reveal scroll triggers only near the screen: no gain in a fair
  A/B, so the original behaviour is back.
- Bundling SplitText again: no difference, so it stays lazy.

**Housekeeping**
- Lighthouse summaries: `reports/before/`, `reports/after/` and
  `reports/iterations/`. Raw reports stay on disk and are ignored by git.

Visual check: every page was captured at 1920x1080, 1440x900, 768x1024 and
390x844 before and after (410 screenshots each) and compared pixel by pixel.
Half the frames are identical. Every difference that was found is intended
or live motion:

- Concept videos caught at a different frame.
- The animated background light at a different point.
- The pricing page's three extra FAQ answers, which make the page longer
  and shift the frames below them.
- The new page links on the 404.

No change to layout, type, colour, the prism or the loader.

## 5. Scores below 100: why, and options (not applied)

**Performance on mobile (82 to 91).** This is the only category below 100 on most pages. The weak metrics are lab LCP (3.2 to 3.7s) and TBT (100 to 370ms). Both come from how much JavaScript runs at startup. React and Next are about 131KB gzipped, GSAP with ScrollTrigger about 44KB, and the site's own shell about 13KB, and all of it has to run before the page is interactive. The loader, prism, light, grain and smooth scrolling are not the cause:

- The loader is plain HTML/CSS plus a small inline script.
- The prism and ogl are split out and start after load.
- Lenis no longer loads on phones.

None of these features were touched for score. Options, not applied:

1. **Move more of the page to Server Components.** Header, footer, the static sections, and most of the pricing and case-study text could render without shipping React code for them. Expected: +2 to +4 mobile (less to hydrate, lower TBT). Effort: medium; no visual change.
2. **Replace GSAP scroll reveals with CSS scroll-driven animations** (`animation-timeline: view()`), and keep GSAP only for the gallery and the pinned process section. GSAP would then load after first paint. Expected: +3 to +6 mobile. Effort: large. Safari and Firefox support is still partial, so a fallback would be needed, and the feel of the reveals would need careful matching.
3. **Case studies: hydrate the lower sections only when they come into view** (recordings, page strip, design system). Expected: +2 to +3 on case studies.
4. **Pricing: render the FAQ answers as server HTML with a CSS-only accordion** (`<details>`). Expected: about +1 on pricing, back to desktop 99 to 100.

Realistically, 100 on mobile Lighthouse would need options 1 and 2 together, and even then it isn't guaranteed. The simulated slow-4G budget is tight for any React site with WebGL and animation. 95+ is a sensible target for that work.

**Performance on desktop (98 to 100):** pricing (98) and a few pages at 99. This is the same startup cost, much smaller on a desktop CPU. Options 1 and 4 cover it.

**Accessibility 96 on home, services and about.** The one failure is colour contrast on the inactive steps of the process section. They rest at 35% opacity, which gives 2.98:1 contrast; small text needs 4.5:1. This is your round 1 design (the active step lights up as you scroll), so I left it.
- Option: raise the resting opacity from 0.35 to about 0.6 in `.step` in `app/globals.css`. Expected: Accessibility 100 on those three pages. The focus effect would still read, but less dramatically.

**Everything else is 100:** Best Practices and SEO on every page, and Accessibility on every other page.

## 6. Decisions I made on my own

1. **Git setup.** The folder was not a git repository. I ran `git init`,
   committed the round 6 site to `main` as the baseline, and did all work on
   the branch.
2. **Raw reports.** Raw Lighthouse reports (1 to 3MB each) are not
   committed; the summaries are. Iteration summaries are grouped under
   `reports/iterations/`.
3. **Process-step contrast.** The inactive process steps stay at 35% opacity
   (your design), even though that is the only accessibility failure. It is
   listed as an option in section 5.
4. **Bundle analyzer.** I used Next's built-in Turbopack analyzer instead of
   `@next/bundle-analyzer`, which only works with webpack builds.
5. **Full-page captures.** They moved from `public/work/` to
   `scripts/output/`. They are still in the repo, but no longer shipped with
   the site.
6. **Vercel Analytics.** It now renders only in Vercel builds, so production
   behaves the same.
7. **Scores measured locally.** There is no Vercel CLI or PageSpeed API
   access here, and deploying was off limits. Every score is local
   Lighthouse, and keep/revert calls came from back-to-back runs against
   `main` because this machine's timings drift.
8. **Case-study descriptions.** Where a case-study summary is short, the
   meta description ends with "Not a client project.", which reaches the
   140-character target and keeps the concept label.
9. **Loader last resort.** The head-script last resort moved from 10s to 12s,
   so it can never cut into the 8s safety finish.
10. **Fair before/after measurement.** Early on, I kept changes based on
    back-to-back runs. When the final run looked worse than the morning
    baseline, I set up an alternating A/B against `main` instead. That showed
    two things. The Reveal deferral didn't help, so I reverted it. The
    security headers were inflating every script and font response locally,
    so they are now sent only with pages. The final table uses the
    alternating method.
11. **Case-study meta descriptions.** Scentu, Verum, Nocturne, Fuku Coffee
    and Homestead had descriptions under 140 characters; they now fit 140 to
    160, using the existing summaries and no new claims.

## 7. What to do after merging

1. Review the branch, then merge `round-7-loader-mobile-performance` into
   `main` yourself. Nothing has been pushed.
2. Deploy as usual. No Vercel, domain or DNS settings need to change.
3. Run https://pagespeed.web.dev on the live home page, /pricing and one case
   study, for both mobile and desktop. Real-network numbers will differ from
   the local ones (see section 5).
4. In Google Search Console (and Bing Webmaster Tools), submit
   `https://www.nuit.works/sitemap.xml`. Then use URL Inspection on the home
   page to check that it is indexed with the new structured data.
5. Check the share previews by pasting the URLs into WhatsApp or Instagram
   DMs, or use a sharing debugger. The new images are under `/og/`.
6. Test the loader on a real iPhone and Android phone. Tap and try to scroll
   during it: it should always finish. Then check that the page cannot be
   dragged sideways.
7. Make sure `RESEND_API_KEY` is set in Vercel so the contact form sends
   email. Optionally also set `CONTACT_FROM_EMAIL`, an address on a domain
   verified in Resend. Without the key, the form shows its email fallback.
   This was unchanged in round 7.
8. If you ever replace a concept video or hero still, give it a new file
   name. Browsers now cache those files for a year.
