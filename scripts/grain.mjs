/*
 * The film grain tile (public/grain.png and public/grain@2x.png).
 *
 *   node scripts/grain.mjs
 *
 * The same noise the old site generated live in CSS (SVG fractal turbulence,
 * base frequency 0.85, three octaves, stitched so it tiles, fully
 * desaturated), rendered once by Chromium into small PNGs so the browser
 * only has to repeat an image. The @2x tile is the same 128px pattern drawn
 * at twice the resolution, so the grain stays equally fine and sharp on
 * high-density screens.
 *
 * The tiles are opaque grey centred on 50% grey, which is neutral for the
 * soft-light blend the site uses (globals.css): lighter specks brighten,
 * darker specks darken, and on average the page's colours are unchanged.
 * The noise has no large-scale structure (nothing coarser than a few
 * pixels), so a 128px repeat is invisible, and 16 grey levels are plenty at
 * the strength it is shown; together these keep the files to a few KB.
 */
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const SIZE = 128;
// One standard deviation of the noise, in grey levels either side of 128.
const SPREAD = 40;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <filter id="n" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#n)"/>
</svg>`;

const browser = await chromium.launch();
for (const scale of [1, 2]) {
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: scale });
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  const shot = await page.locator("svg").screenshot({ omitBackground: true });
  const out = path.join(root, "public", scale === 1 ? "grain.png" : "grain@2x.png");
  // Flatten the noise (grey with varying opacity) onto neutral grey, centre
  // it exactly on 128 and set its contrast.
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const v = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) {
    v[i] = 128 + (data[i * 4] - 128) * (data[i * 4 + 3] / 255);
    mean += v[i] / n;
  }
  let sd = 0;
  for (let i = 0; i < n; i++) sd += (v[i] - mean) ** 2 / n;
  sd = Math.sqrt(sd);
  const grey = Buffer.alloc(n);
  for (let i = 0; i < n; i++) grey[i] = Math.max(0, Math.min(255, Math.round(128 + ((v[i] - mean) * SPREAD) / sd)));
  await sharp(grey, { raw: { width: info.width, height: info.height, channels: 1 } })
    .png({ compressionLevel: 9, palette: true, colours: 16, dither: 0 })
    .toFile(out);
  console.log(out);
  await page.close();
}
await browser.close();
