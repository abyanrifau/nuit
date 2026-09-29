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

<!-- SCORES -->

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
- Reveal animations create their scroll triggers only when within a screen
  of view, which leaves fewer layout reads during startup.
- Links prefetch on intent (hover, touch, focus) instead of as soon as they
  are visible.
- Icons recompressed losslessly (identical pixels, about half the size).
- One-year immutable browser cache for concept media and hero stills.
- 3.3MB of unused full-page captures moved out of `public/`.
- Unused code removed (three icons, one easing constant).
- `npm run analyze` added (Next's built-in bundle analyzer).

**Best practices and security**
- Headers: HSTS, nosniff, Referrer-Policy, X-Frame-Options,
  Cross-Origin-Opener-Policy, Permissions-Policy, and a production
  Content-Security-Policy that allows only the site's own origin.
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

**Housekeeping**
- Lighthouse summaries: `reports/before/`, `reports/after/` and
  `reports/iterations/`. Raw reports stay on disk and are ignored by git.

Visual check: every page was captured at 1920x1080, 1440x900, 768x1024 and
390x844 before and after (410 screenshots each) and compared pixel by pixel.
<!-- VISUAL -->

## 5. Scores below 100: why, and options (not applied)

<!-- BELOW100 -->

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
