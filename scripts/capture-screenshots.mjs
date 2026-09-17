// Captures concept screenshots for the carousel and preview popup.
// Run with: node scripts/capture-screenshots.mjs [--slides-only] [slug ...]
// Requires Playwright Chromium: npx playwright install chromium

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

// `previews` lists which sections of each homepage the popup shows, as
// indexes into the page's section elements (taller than 200px, in order).
// Each is framed from its top so no section is cut mid-way. Index 0 is the
// hero, followed by the two most distinctive sections of that site.
const concepts = [
  { slug: "fuku-coffee", url: "https://cafe-nuit.vercel.app", previews: [0, 2, 5] },
  { slug: "driftwood", url: "https://guesthouse-nuit.vercel.app", previews: [0, 2, 3] },
  { slug: "verum", url: "https://skincare-nuit.vercel.app", previews: [0, 2, 3] },
  { slug: "homestead", url: "https://furniture-nuit.vercel.app", previews: [0, 1, 2] },
  { slug: "scentu", url: "https://perfume-nuit.vercel.app", previews: [0, 3, 4] },
  { slug: "nocturne", url: "https://cafe2-nuit.vercel.app", previews: [0, 3, 4] },
];

const SLIDE = { width: 1440, height: 810 }; // 16:9, matches the carousel slides
const DESKTOP = { width: 1440, height: 900 };
const JPEG_QUALITY = 88;
const SCALE = 2; // capture at 2x for high-density screens
const INTRO_WAIT_MS = 6000;
const IMAGE_WAIT_MS = 8000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((r) => setTimeout(r, ms))]);

/** Wait for network, fonts, images, and any intro animation to settle. */
async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await withTimeout(page.evaluate(() => document.fonts.ready), IMAGE_WAIT_MS);
  // Lazy images below the fold never fire load until scrolled to, so cap this wait.
  await withTimeout(
    page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.addEventListener("load", res, { once: true });
                img.addEventListener("error", res, { once: true });
              }),
        ),
      );
    }),
    IMAGE_WAIT_MS,
  );
  await sleep(INTRO_WAIT_MS);
}

/** Scroll slowly through the whole page to trigger lazy and scroll-revealed content. */
async function warmScroll(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.round(window.innerHeight * 0.4);
    let y = 0;
    let guard = 0;
    while (y < document.documentElement.scrollHeight - window.innerHeight && guard < 200) {
      y += step;
      window.scrollTo(0, y);
      await wait(180);
      guard++;
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await wait(600);
    window.scrollTo(0, 0);
    await wait(800);
  });
  await page.mouse.wheel(0, 0);
  await sleep(600);
}

async function scrollToAndSettle(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "auto" }), y);
  await sleep(1800);
}

async function shoot(page, file) {
  await page.screenshot({ path: file, type: "jpeg", quality: JPEG_QUALITY });
  console.log("  saved", path.relative(process.cwd(), file));
}

async function captureConcept(browser, concept) {
  const dir = path.join(process.cwd(), "public", "concepts", concept.slug);
  await mkdir(dir, { recursive: true });
  console.log(`\n${concept.slug} (${concept.url})`);

  // Slide: 16:9 desktop capture of the top of the homepage.
  {
    const ctx = await browser.newContext({
      viewport: SLIDE,
      deviceScaleFactor: SCALE,
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    await page.goto(concept.url, { waitUntil: "load", timeout: 60000 });
    await settle(page);
    await warmScroll(page);
    await scrollToAndSettle(page, 0);
    await shoot(page, path.join(dir, "slide.jpg"));
    await ctx.close();
  }

  if (slidesOnly) return;

  // Previews: desktop captures of the hero and two chosen sections, each framed from its top.
  {
    const ctx = await browser.newContext({
      viewport: DESKTOP,
      deviceScaleFactor: SCALE,
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    await page.goto(concept.url, { waitUntil: "load", timeout: 60000 });
    await settle(page);
    await warmScroll(page);

    // Section tops, measured after the warm scroll so lazy content has sized.
    const tops = await page.evaluate(() =>
      Array.from(document.querySelectorAll("section"))
        .filter((el) => el.offsetHeight > 200)
        .map((el) => Math.round(el.getBoundingClientRect().top + window.scrollY)),
    );
    const maxScroll = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    const positions = concept.previews.map((i) =>
      i === 0 ? 0 : Math.min(maxScroll, tops[i] ?? Math.round(maxScroll * (i / tops.length))),
    );

    for (let i = 0; i < positions.length; i++) {
      await scrollToAndSettle(page, positions[i]);
      await shoot(page, path.join(dir, `preview-${i + 1}.jpg`));
    }
    await ctx.close();
  }
}

const args = process.argv.slice(2);
const slidesOnly = args.includes("--slides-only");
const only = args.filter((a) => !a.startsWith("--"));
const targets = only.length ? concepts.filter((c) => only.includes(c.slug)) : concepts;

const browser = await chromium.launch({ headless: true });
try {
  for (const concept of targets) {
    try {
      await captureConcept(browser, concept);
    } catch (err) {
      console.error(`  failed ${concept.slug}:`, err.message);
      process.exitCode = 1;
    }
  }
} finally {
  await browser.close();
}
