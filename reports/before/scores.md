# Baseline scores (before round 7)

Lighthouse 13.5, local production build, median of 3 runs. Mobile uses the default (PageSpeed Insights) throttling; desktop uses the desktop preset.

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
