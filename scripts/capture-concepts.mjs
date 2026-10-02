// Captures every piece of media the site shows for a concept:
//   - smooth top-to-bottom scroll recordings at desktop (1440x900) and mobile
//     (390x844), encoded as MP4 (H.264) and WebM (VP9), muted and loop-friendly;
//     or, when data/concept-sources.ts gives the concept a `tour`, a scripted
//     walk through its standout flow instead (see recordTour)
//   - a poster frame for each recording
//   - a full-page screenshot at both sizes, the first screen of each key page,
//     and two or three key components, all as WebP
//   - the concept's design system (fonts and main colours), written to
//     scripts/output/<slug>.json for review before it goes into data/work.ts
//
// Run on demand, never as part of the build:
//   npm run capture                      all concepts
//   npm run capture -- driftwood verum   only these
//   npm run capture -- --no-video        stills and design system only
//   npm run capture -- --video-only      recordings only
//
// Requires Playwright's Chromium (npx playwright install chromium). ffmpeg
// comes from the ffmpeg-static dev dependency.

import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile, readFile, readdir, stat } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { workSources } from "../data/concept-sources.ts";

const ROOT = process.cwd();

/** Where reference-only captures for a project go: scripts/output/<slug>/. */
function refDir(outDir) {
  const dir = path.join(ROOT, "scripts", "output", path.basename(outDir));
  mkdirSync(dir, { recursive: true });
  return dir;
}
const CACHE = path.join(ROOT, "scripts", ".cache");
const OUTPUT = path.join(ROOT, "scripts", "output");

const DESKTOP = { width: 1440, height: 900, scale: 1 };
const MOBILE = { width: 390, height: 844, scale: 2 };
const FPS = 30;

// Scroll speed in CSS px per second, and the bounds on each recording's length.
const RECORDING = {
  desktop: { pxPerSecond: 760, min: 9, max: 16, outWidth: 1280 },
  mobile: { pxPerSecond: 900, min: 9, max: 16, outWidth: 600 },
};
const HOLD_TOP_S = 1.0;
const HOLD_BOTTOM_S = 0.5;
const CROSSFADE_S = 0.7;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withTimeout = (promise, ms) => Promise.race([promise, sleep(ms)]);
const log = (...a) => console.log(...a);

/* ---------------------------------------------------------------- helpers */

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exited ${code}\n${err.slice(-1200)}`)),
    );
  });
}

async function newPage(browser, size, mobile) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.scale,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: "no-preference",
    colorScheme: "light",
  });
  const page = await context.newPage();
  return { context, page };
}

/** Wait for network, fonts and images, then give intro animations time to finish. */
async function settle(page, extraMs = 3500) {
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  await withTimeout(page.evaluate(() => document.fonts.ready), 8000);
  await withTimeout(
    page.evaluate(() =>
      Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map((img) => new Promise((r) => {
            img.addEventListener("load", r, { once: true });
            img.addEventListener("error", r, { once: true });
          })),
      ),
    ),
    8000,
  );
  await sleep(extraMs);
}

/** Scroll the whole page once so lazy images load and scroll reveals have run. */
async function warmScroll(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.round(window.innerHeight * 0.5);
    for (let y = 0, i = 0; y < document.documentElement.scrollHeight && i < 200; y += step, i++) {
      window.scrollTo(0, y);
      await wait(140);
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await wait(700);
  });
  await scrollTo(page, 0);
  await sleep(1200);
}

/** Jump to a scroll position and wait two frames so the page has painted it. */
async function scrollTo(page, y) {
  return page.evaluate(
    (top) =>
      new Promise((resolve) => {
        // Smooth-scroll libraries (Lenis and friends) keep their own target;
        // setting both keeps them in step with the jump.
        const lenis = window.lenis || window.__lenis;
        if (lenis && typeof lenis.scrollTo === "function") lenis.scrollTo(top, { immediate: true, force: true });
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, top);
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(window.scrollY)));
      }),
    y,
  );
}

const easeInOut = (t) => 0.5 - Math.cos(Math.PI * t) / 2;

/* ------------------------------------------------------------- recordings */

async function record(browser, source, kind, outDir) {
  const size = kind === "desktop" ? DESKTOP : MOBILE;
  const cfg = RECORDING[kind];
  const { context, page } = await newPage(browser, size, kind === "mobile");
  const frameDir = path.join(CACHE, source.slug, kind);
  await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });

  try {
    await page.goto(source.url, { waitUntil: "load", timeout: 60000 });
    await settle(page);
    await warmScroll(page);

    let n = 0;
    const shoot = async () => {
      const file = path.join(frameDir, `${String(n++).padStart(5, "0")}.jpg`);
      await page.screenshot({ path: file, type: "jpeg", quality: 92 });
      return file;
    };
    const put = async (buf) => {
      const file = path.join(frameDir, `${String(n++).padStart(5, "0")}.jpg`);
      await writeFile(file, buf);
      return file;
    };

    if (source.tour?.[kind]) {
      const { first, last } = await recordTour(page, source, source.tour[kind], shoot, put);
      await loopFade(first, last, put);
      log(`  ${kind}: tour of ${source.tour[kind].length} steps, ${(n / FPS).toFixed(1)}s`);
      await encode(frameDir, outDir, kind, cfg.outWidth, true);
      return { tour: true, seconds: +(n / FPS).toFixed(2) };
    }

    const maxScroll = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    const scrollSeconds = Math.min(cfg.max, Math.max(cfg.min, maxScroll / cfg.pxPerSecond));
    const holdTop = Math.round(HOLD_TOP_S * FPS);
    const scrollFrames = Math.round(scrollSeconds * FPS);
    const holdBottom = Math.round(HOLD_BOTTOM_S * FPS);
    log(`  ${kind}: ${maxScroll}px over ${scrollSeconds.toFixed(1)}s`);

    await scrollTo(page, 0);
    await sleep(300);
    const first = await shoot();
    for (let i = 1; i < holdTop; i++) await shoot();

    let drift = 0;
    for (let i = 1; i <= scrollFrames; i++) {
      const target = Math.round(maxScroll * easeInOut(i / scrollFrames));
      const actual = await scrollTo(page, target);
      drift = Math.max(drift, Math.abs(actual - target));
      await shoot();
    }
    if (drift > 4) log(`  ! ${kind}: scroll drifted by up to ${Math.round(drift)}px, check the recording`);

    let last = "";
    for (let i = 0; i < holdBottom; i++) last = await shoot();

    await loopFade(first, last, put);

    await encode(frameDir, outDir, kind, cfg.outWidth);
    return { maxScroll, seconds: +(n / FPS).toFixed(2) };
  } finally {
    await context.close();
  }
}

/** Blend frame `a` into frame `b` over `frames` frames (both are files or buffers). */
async function crossfade(a, b, frames, put) {
  const from = await sharp(a).toBuffer();
  const to = await sharp(b).toBuffer();
  for (let i = 1; i <= frames; i++) {
    const t = easeInOut(i / frames);
    const blended = await sharp(from)
      .composite([{ input: await sharp(to).ensureAlpha(t).toBuffer(), blend: "over" }])
      .jpeg({ quality: 92 })
      .toBuffer();
    await put(blended);
  }
}

/** Cross-fade the last frame into the first so the loop has no jump cut. */
const loopFade = (first, last, put) => crossfade(last, first, Math.round(CROSSFADE_S * FPS), put);

/**
 * A scripted recording (TourStep[] from data/concept-sources.ts). Scrolls are
 * filmed frame by frame like the plain recordings; after a click the page is
 * filmed in real time and resampled to the frame rate, so its own animations
 * play at their real speed. A new page cross-fades in from the last frame.
 */
async function recordTour(page, source, steps, shoot, put) {
  let first = null;
  let last = null;
  const frame = async () => {
    last = await shoot();
    first ??= last;
  };
  const vh = page.viewportSize().height;
  const easeScroll = async (to, seconds) => {
    const from = await page.evaluate(() => window.scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    const target = Math.max(0, Math.min(max, Math.round(to)));
    const frames = Math.max(1, Math.round(seconds * FPS));
    for (let i = 1; i <= frames; i++) {
      await scrollTo(page, Math.round(from + (target - from) * easeInOut(i / frames)));
      await frame();
    }
  };

  for (const step of steps) {
    if ("goto" in step) {
      const previous = last;
      await page.goto(new URL(step.goto, source.url).href, { waitUntil: "load", timeout: 60000 });
      await settle(page, 1200);
      await scrollTo(page, 0);
      await sleep(300);
      const shot = await page.screenshot({ type: "jpeg", quality: 92 });
      if (previous) await crossfade(previous, shot, Math.round(0.45 * FPS), put);
      last = await put(shot);
      first ??= last;
    } else if ("hold" in step) {
      if (!last) await frame();
      const buf = await readFile(last);
      for (let i = 0; i < Math.round(step.hold * FPS); i++) last = await put(buf);
    } else if ("scroll" in step) {
      const to =
        typeof step.scroll === "number"
          ? step.scroll
          : await page.locator(step.scroll).first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY - 80);
      await easeScroll(to, step.s);
    } else if ("click" in step) {
      const el = page.locator(step.click).first();
      // Bring it into view smoothly first, so the click never jumps the page.
      const box = await el.boundingBox();
      if (box && (box.y < 70 || box.y + box.height > vh - 40) && !(await el.evaluate((n) => !!n.closest("[role=dialog], dialog")))) {
        await easeScroll((await page.evaluate(() => window.scrollY)) + box.y - vh * 0.4, 0.7);
      }
      await el.click({ timeout: 15000 });
      const shots = [];
      const t0 = Date.now();
      while (Date.now() - t0 < step.s * 1000) shots.push({ t: Date.now() - t0, buf: await page.screenshot({ type: "jpeg", quality: 92 }) });
      for (let i = 0, j = 0; i < Math.round(step.s * FPS); i++) {
        while (j + 1 < shots.length && shots[j + 1].t <= (i * 1000) / FPS) j++;
        last = await put(shots[j].buf);
      }
    }
  }
  return { first, last };
}

// Tours change the picture far more than a scroll and run about twice as
// long, so their WebM is compressed a little harder to stay a similar size.
async function encode(frameDir, outDir, kind, outWidth, tour = false) {
  const input = ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(frameDir, "%05d.jpg")];
  const scale = `scale=${outWidth}:-2:flags=lanczos,format=yuv420p`;

  await run(ffmpegPath, [
    ...input, "-vf", scale, "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", kind === "desktop" ? "28" : "31",
    "-profile:v", "high", "-movflags", "+faststart",
    path.join(outDir, `${kind}.mp4`),
  ]);
  await run(ffmpegPath, [
    ...input, "-vf", scale, "-an",
    "-c:v", "libvpx-vp9", "-crf", String((kind === "desktop" ? 38 : 40) + (tour ? 6 : 0)), "-b:v", "0",
    "-row-mt", "1", "-deadline", "good", "-cpu-used", "3",
    path.join(outDir, `${kind}.webm`),
  ]);

  // Poster: the first frame, at the video's size.
  await sharp(path.join(frameDir, "00000.jpg"))
    .resize({ width: outWidth })
    .webp({ quality: 78 })
    .toFile(path.join(outDir, `${kind}-poster.webp`));

  for (const f of [`${kind}.mp4`, `${kind}.webm`, `${kind}-poster.webp`]) {
    const s = await stat(path.join(outDir, f));
    log(`    ${f} ${(s.size / 1024).toFixed(0)} KB`);
  }
}

/* ----------------------------------------------------------------- stills */

/** WebP caps each side at 16383px; very long pages are scaled to fit. */
async function toWebp(buffer, file, width, quality = 80) {
  let img = sharp(buffer, { limitInputPixels: false });
  const meta = await img.metadata();
  const w = Math.min(width, meta.width);
  const h = Math.round((meta.height * w) / meta.width);
  const fit = h > 16000 ? Math.floor((w * 16000) / h) : w;
  img = img.resize({ width: fit });
  await img.webp({ quality }).toFile(file);
}

async function stills(browser, source, outDir) {
  const result = { pages: [], components: [], specimens: [], designSystem: null };
  for (const dir of ["pages", "components", "specimens"]) {
    await rm(path.join(outDir, dir), { recursive: true, force: true });
  }

  // Desktop: full page, key pages, components, design system.
  {
    const { context, page } = await newPage(browser, DESKTOP, false);
    try {
      await page.goto(source.url, { waitUntil: "load", timeout: 60000 });
      await settle(page);
      await warmScroll(page);

      // Full-page captures are reference material, not used on the site, so
      // they are kept out of public/ (scripts/output/<slug>/).
      await toWebp(await page.screenshot({ fullPage: true, type: "png" }), path.join(refDir(outDir), "full.webp"), 1440, 72);
      log("    full.webp");

      result.designSystem = await extractDesignSystem(page);
      result.components = await captureComponents(page, source, outDir);

      result.specimens = await captureSpecimens(page, result.designSystem, outDir);

      // Key pages: the home screen plus up to three internal pages from the nav.
      const links = await page.evaluate((origin) => {
        const norm = (p) => p.replace(/\/index\.html?$/, "/").replace(/\/+$/, "") || "/";
        const seen = new Set(["/"]);
        const out = [];
        const anchors = document.querySelectorAll("header a[href], nav a[href]");
        for (const a of anchors) {
          const u = new URL(a.getAttribute("href"), location.href);
          const p = norm(u.pathname);
          // Skip anchors, the logo link and anything already listed.
          if (u.origin !== origin || u.hash || seen.has(p) || a.querySelector("img, svg")) continue;
          seen.add(p);
          out.push({ path: u.pathname, label: (a.textContent || "").trim().replace(/\s+/g, " ") });
        }
        return out.slice(0, 3);
      }, new URL(source.url).origin);

      await mkdir(path.join(outDir, "pages"), { recursive: true });
      const targets = [{ path: "/", label: "Home" }, ...links];
      for (const [i, t] of targets.entries()) {
        const name = `${String(i + 1).padStart(2, "0")}-${slugify(t.label || t.path) || "page"}`;
        if (i > 0) {
          // Click through from the homepage like a visitor would: some
          // concepts are single-page apps whose inner URLs only resolve
          // client-side. Fall back to loading the URL directly.
          await page.goto(source.url, { waitUntil: "load", timeout: 60000 });
          await settle(page, 1500);
          const link = page.locator(`header a[href="${t.path}"], nav a[href="${t.path}"]`).first();
          const clicked = (await link.count()) && (await link.click({ timeout: 5000 }).then(() => true, () => false));
          if (!clicked) await page.goto(new URL(t.path, source.url).href, { waitUntil: "load", timeout: 60000 });
          await settle(page, 2500);
        }
        await scrollTo(page, 0);
        await sleep(600);
        await toWebp(await page.screenshot({ type: "png" }), path.join(outDir, "pages", `${name}.webp`), 1440, 80);
        result.pages.push({ file: `pages/${name}.webp`, label: t.label || "Home", path: t.path });
        log(`    pages/${name}.webp`);
      }
    } finally {
      await context.close();
    }
  }

  // Mobile full page.
  {
    const { context, page } = await newPage(browser, MOBILE, true);
    try {
      await page.goto(source.url, { waitUntil: "load", timeout: 60000 });
      await settle(page);
      await warmScroll(page);
      await toWebp(await page.screenshot({ fullPage: true, type: "png" }), path.join(refDir(outDir), "full-mobile.webp"), 780, 72);
      log("    full-mobile.webp");
    } finally {
      await context.close();
    }
  }

  return result;
}

const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 32);

/** Screenshots of two or three representative components, with a little breathing room. */
async function captureComponents(page, source, outDir) {
  await mkdir(path.join(outDir, "components"), { recursive: true });
  await scrollTo(page, 0);
  await sleep(500);

  const picks = source.components?.length
    ? source.components
    : await page.evaluate(() => {
        // On the page, laid out, and not tucked away off screen (skip links and
        // closed drawers usually are).
        const visible = (el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const top = r.top + window.scrollY;
          return (
            r.width > 0 && r.height > 0 && top >= 0 && r.left >= 0 && r.right <= innerWidth &&
            cs.visibility !== "hidden" && Number(cs.opacity) > 0.5 && !el.closest("[aria-hidden='true']")
          );
        };
        const filled = (cs) => cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
        const mark = (el, name) => {
          el.setAttribute("data-nw-capture", name);
          return { name, selector: `[data-nw-capture="${name}"]` };
        };
        const out = [];

        const header = document.querySelector("header") || document.querySelector("nav");
        if (header && visible(header)) out.push(mark(header, "navigation"));
        const footer = document.querySelector("footer");
        const inChrome = (el) => header?.contains(el) || footer?.contains(el);

        // A solid button: filled background, some padding, short label.
        const button = Array.from(document.querySelectorAll("main a, main button, a, button")).find((el) => {
          if (!visible(el) || inChrome(el)) return false;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          const text = (el.textContent || "").trim();
          return (
            filled(cs) && r.width > 80 && r.width < 420 && r.height > 32 && r.height < 90 &&
            text.length > 1 && text.length < 32 && !/skip/i.test(text)
          );
        });
        if (button) out.push(mark(button, "button"));

        // A card: a mid-sized block with a heading and some text that stands
        // apart from its surroundings (its own background, border or image).
        const card = Array.from(document.querySelectorAll("article, li, a, div")).find((el) => {
          if (!visible(el) || inChrome(el)) return false;
          const r = el.getBoundingClientRect();
          if (r.width < 220 || r.width > 560 || r.height < 140 || r.height > 760) return false;
          if (!el.querySelector("h2, h3, h4") || el.querySelectorAll("img").length > 2) return false;
          const cs = getComputedStyle(el);
          const framed = filled(cs) || parseFloat(cs.borderTopWidth) > 0 || el.querySelector("img");
          return framed && (el.querySelector("p") || el.querySelector("img"));
        });
        if (card) out.push(mark(card, "card"));
        return out;
      });

  const saved = [];
  for (const pick of picks.slice(0, 3)) {
    const el = page.locator(pick.selector).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(700);
    const box = await el.boundingBox();
    if (!box) continue;
    const pad = pick.name === "navigation" ? 0 : 32;
    const vp = page.viewportSize();
    const clip = {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(vp.width - Math.max(0, box.x - pad), box.width + pad * 2),
      height: Math.min(vp.height - Math.max(0, box.y - pad), box.height + pad * 2),
    };
    const buf = await page.screenshot({ type: "png", clip });
    const file = `components/${pick.name}.webp`;
    await toWebp(buf, path.join(outDir, file), 1440, 86);
    saved.push({ name: pick.name, file, width: Math.round(clip.width), height: Math.round(clip.height) });
    log(`    ${file}`);
  }
  return saved;
}

/**
 * Type specimens, set inside the concept's own page so they use its real,
 * already-loaded fonts. Light text on a transparent background, to sit on the
 * site's dark case-study pages. One per distinct face (display and body).
 */
async function captureSpecimens(page, ds, outDir) {
  await mkdir(path.join(outDir, "specimens"), { recursive: true });
  const faces = [];
  for (const role of ["display", "body"]) {
    const f = ds?.fonts?.[role];
    if (!f?.family) continue;
    const key = `${f.family}|${f.weight}|${f.style}`;
    if (faces.some((x) => x.key === key)) continue;
    faces.push({ role, key, ...f });
  }

  const saved = [];
  for (const face of faces) {
    const box = await page.evaluate((f) => {
      document.getElementById("nw-specimen")?.remove();
      document.getElementById("nw-specimen-style")?.remove();
      const style = document.createElement("style");
      style.id = "nw-specimen-style";
      // Hide the page, including grain or vignette overlays drawn with
      // pseudo-elements, so only the specimen is captured.
      style.textContent =
        "html,body{background:transparent!important}body>*:not(#nw-specimen){visibility:hidden!important}" +
        "html::before,html::after,body::before,body::after{display:none!important}";
      document.head.appendChild(style);
      const el = document.createElement("div");
      el.id = "nw-specimen";
      el.style.cssText = [
        "position:fixed", "left:0", "top:0", "z-index:2147483647", "padding:24px 32px 32px",
        "width:980px", "color:#f4f4f2", "background:transparent", "visibility:visible",
        `font-family:${f.stack}`, `font-weight:${f.weight}`, `font-style:${f.style}`,
        "text-transform:none", "letter-spacing:0", "-webkit-font-smoothing:antialiased",
      ].join(";");
      el.innerHTML =
        '<div style="font-size:168px;line-height:1.05">Aa</div>' +
        '<div style="margin-top:20px;font-size:30px;line-height:1.4">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 &amp; ? ! , .</div>';
      document.body.appendChild(el);
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }, face);
    // Make sure the face is loaded before shooting, or the browser draws the
    // specimen in a fallback font without saying so.
    const loaded = await page.evaluate(async (f) => {
      const font = `${f.style} ${f.weight} 168px ${f.stack}`;
      await document.fonts.load(font, "Aa").catch(() => {});
      return document.fonts.check(font, "Aa");
    }, face);
    if (!loaded) log(`  ! specimen font may not have loaded: ${face.family} ${face.weight}`);
    await sleep(300);
    const buf = await page.screenshot({ type: "png", omitBackground: true, clip: box });
    const file = `specimens/${face.role}.webp`;
    await sharp(buf).webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(outDir, file));
    saved.push({ role: face.role, family: face.family, weight: face.weight, style: face.style, file });
    log(`    ${file} (${face.family} ${face.weight})`);
  }
  await page.evaluate(() => {
    document.getElementById("nw-specimen")?.remove();
    document.getElementById("nw-specimen-style")?.remove();
  });
  return saved;
}

/* ---------------------------------------------------------- design system */

async function extractDesignSystem(page) {
  await scrollTo(page, 0);
  return page.evaluate(() => {
    /**
     * Build tools rename font families: next/font gives "__Cormorant_Garamond_4f2a1c",
     * others "Geist-df0175e0576b3b31". Recover the real name.
     */
    const clean = (stack) =>
      (stack || "")
        .split(",")
        .map((f) => f.trim().replace(/^["']|["']$/g, ""))
        .map((f) => {
          const m = f.match(/^__(.+?)(_Fallback)?_[a-f0-9]{5,8}$/i);
          if (m) return m[2] ? "" : m[1].replace(/_/g, " ");
          return f.replace(/-[a-f0-9]{12,}( fallback.*)?$/i, (_, fb) => (fb ? " fallback" : ""));
        })
        .filter((f) => f && !/fallback/i.test(f));

    const fontOf = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return {
        selector: sel,
        family: clean(cs.fontFamily)[0] || null,
        stack: cs.fontFamily,
        weight: cs.fontWeight,
        style: cs.fontStyle,
        size: cs.fontSize,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        sample: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60),
      };
    };

    // The body face is whichever family carries the most paragraph text, so a
    // one-off caption in another script does not win.
    const bodyFont = () => {
      const tally = new Map();
      let best = null;
      for (const p of Array.from(document.querySelectorAll("p"))) {
        const len = (p.textContent || "").trim().length;
        if (!len) continue;
        const fam = clean(getComputedStyle(p).fontFamily)[0];
        const n = (tally.get(fam) || 0) + len;
        tally.set(fam, n);
        if (!best || n > best.n || (fam === best.fam && len > best.len)) best = { fam, n, len, el: p };
      }
      if (!best) return null;
      const el = Array.from(document.querySelectorAll("p"))
        .filter((p) => clean(getComputedStyle(p).fontFamily)[0] === best.fam)
        .sort((a, b) => (b.textContent || "").length - (a.textContent || "").length)[0];
      el.setAttribute("data-nw-body", "");
      return fontOf("[data-nw-body]");
    };

    const fonts = {
      display: fontOf("h1"),
      heading: fontOf("h2"),
      body: bodyFont(),
      ui: fontOf("nav a") || fontOf("button"),
    };

    // Colour custom properties declared on :root.
    const vars = {};
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules || [])) {
        if (!rule.style || !/(^|,)\s*(:root|html)\b/.test(rule.selectorText || "")) continue;
        for (const prop of Array.from(rule.style)) {
          if (!prop.startsWith("--")) continue;
          const v = rule.style.getPropertyValue(prop).trim();
          if (/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\(|oklab\()/i.test(v)) vars[prop] = v;
        }
      }
    }

    // Colours in use, weighted by how much of the page they cover.
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const toHex = (c) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      if (a < 200) return null;
      return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
    };
    const bg = new Map();
    const text = new Map();
    const add = (m, k, w) => k && m.set(k, (m.get(k) || 0) + w);
    const all = Array.from(document.querySelectorAll("body *")).slice(0, 6000);
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      add(bg, toHex(cs.backgroundColor), r.width * r.height);
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
      if (own) add(text, toHex(cs.color), own.length * parseFloat(cs.fontSize) ** 2);
    }
    add(bg, toHex(getComputedStyle(document.body).backgroundColor), innerWidth * document.documentElement.scrollHeight * 0.5);
    const top = (m, n) =>
      Array.from(m.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([hex, w]) => ({ hex, weight: Math.round(w) }));

    return { fonts, cssColorVars: vars, backgrounds: top(bg, 8), textColors: top(text, 6) };
  });
}

/* ------------------------------------------------------------------- main */

const args = process.argv.slice(2);
const noVideo = args.includes("--no-video");
const videoOnly = args.includes("--video-only");
const only = args.filter((a) => !a.startsWith("--"));
const targets = only.length ? workSources.filter((s) => only.includes(s.slug)) : workSources;

const skipped = targets.filter((s) => !s.url);
for (const s of skipped) log(`skipping ${s.slug}: no live URL`);

await mkdir(OUTPUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const source of targets.filter((s) => s.url)) {
    const outDir = path.join(ROOT, "public", "work", source.slug);
    await mkdir(outDir, { recursive: true });
    log(`\n${source.slug} (${source.url})`);
    // A partial run (--video-only or --no-video) keeps the rest of the last report.
    const previous = await readFile(path.join(OUTPUT, `${source.slug}.json`), "utf8").then(JSON.parse, () => ({}));
    const report = { ...previous, slug: source.slug, url: source.url, capturedAt: new Date().toISOString() };
    try {
      if (!videoOnly) Object.assign(report, await stills(browser, source, outDir));
      if (!noVideo) {
        report.recordings = {
          desktop: await record(browser, source, "desktop", outDir),
          mobile: await record(browser, source, "mobile", outDir),
        };
      }
      await writeFile(path.join(OUTPUT, `${source.slug}.json`), JSON.stringify(report, null, 2));
      await rm(path.join(CACHE, source.slug), { recursive: true, force: true });
    } catch (err) {
      console.error(`  failed ${source.slug}:`, err.message);
      process.exitCode = 1;
    }
  }
} finally {
  await browser.close();
}

// New captures need new URLs (browsers cache concept media for a year).
await run(process.execPath, [path.join(ROOT, "scripts", "media-versions.mjs")]);

const files = await readdir(OUTPUT).catch(() => []);
log(`\ndone. reports in scripts/output (${files.length} files)`);
