/*
 * Social share images (Open Graph / Twitter), one per main page and one per
 * case study, in the site's own style: near-black, film grain, the hero
 * prism's light, Alte Haas Grotesk and Helvetica Neue. Rendered with
 * Playwright from local files and saved as compressed JPEGs in public/og/.
 *
 *   node scripts/og-images.mjs
 *
 * The page list below mirrors the pages' own headings and data/work.ts; run
 * it again after changing either.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const file = (p) => pathToFileURL(path.join(root, p)).href;
const OUT = path.join(root, "public/og");

const pages = [
  { name: "work", lines: ["Concepts, built", "to be used."], sub: "Six concept websites, designed and built in the Maldives." },
  { name: "services", lines: ["Everything you", "need to be online."], sub: "Design, development, hosting and support." },
  { name: "pricing", lines: ["Clear prices,", "quoted to fit."], sub: "Websites from MVR 3,500. Hosting and support from MVR 300 a month." },
  { name: "about", lines: ["A web studio", "in the Maldives."], sub: "We design, build, host and look after websites." },
  { name: "contact", lines: ["Start a", "project."], sub: "hello@nuit.works  ·  @nuit.works" },
];

const cases = [
  { slug: "driftwood", name: "Driftwood", industry: "Guesthouse", summary: "A guesthouse site with a full booking flow, from dates to confirmation." },
  { slug: "scentu", name: "Scentu", industry: "Fragrance", summary: "A fragrance shop sorted by how things smell, not by brand." },
  { slug: "verum", name: "VERUM", industry: "Skincare shop", summary: "Built around a 30-second quiz that builds your routine." },
  { slug: "nocturne", name: "Nocturne", industry: "Coffee bar", summary: "A coffee bar site built around low light and late evenings." },
  { slug: "fuku-coffee", name: "Fuku Coffee", industry: "Café", summary: "A calm café site with a Japanese touch." },
  { slug: "homestead", name: "Homestead", industry: "Furniture", summary: "A furniture shop with six pieces and room to breathe." },
];

const grain =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const shell = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: G; src: url("${file("app/fonts/AlteHaasGroteskBold.woff2")}") format("woff2"); font-weight: 700; }
@font-face { font-family: N; src: url("${file("app/fonts/HelveticaNeueLight.woff2")}") format("woff2"); font-weight: 300; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; background: #0b0b0c; color: #f4f4f2; overflow: hidden; }
body { position: relative; font-family: N; font-weight: 300; }
.grain { position: absolute; inset: 0; opacity: .06; background-image: url("${grain}"); background-size: 240px 240px; z-index: 5; }
.prism { position: absolute; background: url("${file("public/hero-poster-desktop.webp")}") center / 100% 100% no-repeat; }
.mark { position: absolute; left: 64px; top: 52px; font-family: G; font-size: 30px; letter-spacing: -0.03em; }
.title { font-family: G; font-weight: 700; letter-spacing: -0.045em; line-height: .9; }
.sub { font-size: 28px; line-height: 1.3; color: #a6a6a3; }
.tag { display: inline-block; border: 1px solid rgb(255 255 255 / .3); border-radius: 999px; padding: 8px 18px; font-size: 18px; letter-spacing: .12em; text-transform: uppercase; }
</style></head><body>${body}<div class="grain"></div></body></html>`;

const pageHtml = (p) =>
  shell(`<div class="prism" style="left:560px; top:-250px; width:900px; height:900px; opacity:.95"></div>
<div class="mark">Nuit Works.</div>
<div style="position:absolute; left:64px; bottom:64px; right:64px">
  <div class="title" style="font-size:112px">${p.lines.map((l) => `<div>${l}</div>`).join("")}</div>
  <div class="sub" style="margin-top:34px">${p.sub}</div>
</div>`);

const caseHtml = (c) =>
  shell(`<div class="prism" style="left:430px; top:-330px; width:1000px; height:1000px; opacity:.8"></div>
<div class="mark">Nuit Works.</div>
<div style="position:absolute; left:64px; top:190px; width:430px">
  <span class="tag">Concept</span>
  <div class="title" style="font-size:84px; margin-top:28px">${c.name}</div>
  <div class="sub" style="margin-top:24px; font-size:24px">${c.industry} concept website. ${c.summary}</div>
</div>
<div style="position:absolute; left:560px; top:120px; width:580px; border-radius:14px; overflow:hidden; border:1px solid rgb(255 255 255 / .14); box-shadow: 0 40px 100px -20px rgb(0 0 0 / .8); background:#131315">
  <div style="height:30px; display:flex; align-items:center; gap:7px; padding-left:14px; border-bottom:1px solid rgb(255 255 255 / .1)">
    <span style="width:9px;height:9px;border-radius:50%;background:rgb(255 255 255 / .25)"></span><span style="width:9px;height:9px;border-radius:50%;background:rgb(255 255 255 / .25)"></span><span style="width:9px;height:9px;border-radius:50%;background:rgb(255 255 255 / .25)"></span>
  </div>
  <img src="${file(`public/work/${c.slug}/desktop-poster.webp`)}" style="display:block; width:100%; aspect-ratio:16/10; object-fit:cover; object-position:top">
</div>`);

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// Written to a local file first, so the page may load the local fonts and images.
const tmp = path.join(root, "scripts/.cache/og.html");
await mkdir(path.dirname(tmp), { recursive: true });
const render = async (html, name) => {
  await writeFile(tmp, html);
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${name}.jpg`));
  console.log("og/" + name + ".jpg");
};
for (const p of pages) await render(pageHtml(p), p.name);
for (const c of cases) await render(caseHtml(c), `work-${c.slug}`);
await browser.close();
