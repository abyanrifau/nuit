# Final scores (after round 7)

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


