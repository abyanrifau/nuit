#!/usr/bin/env node
/**
 * Captures the concept-card imagery in assets/concepts/ — the hero plus two
 * further sections per concept, used by the #work cards and the quick look.
 *
 * Run by hand whenever a concept site changes; nothing on the page calls it:
 *
 *     npm install && npx playwright install chromium   # one time
 *     node capture-concepts.mjs [--dry] [slug ...]      # all, or just some
 *
 * --dry prints the sections found and the two picked, without writing files.
 *
 * Shots 2 and 3 are framed on real section boundaries, not pixel offsets. A
 * fixed offset lands wherever it lands: mid-section with the heading sliced off
 * under the sticky nav, or twice inside one tall section. So the script finds the
 * page's full-width blocks, prefers ones that fit the viewport and carry imagery,
 * scrolls until the chosen block's top edge sits just under the sticky header,
 * and then compares the three shots — a pair that looks alike is thrown out and
 * the next candidate tried.
 *
 * Scrolling is done with real wheel events, corrected in passes. Every concept
 * reveals content on scroll and several smooth-scroll the window, which ignores
 * scrollTo and eases past a single large wheel delta.
 *
 * Output is JPEG, not PNG: eighteen full-width PNGs run to tens of megabytes.
 */
import { chromium } from 'playwright';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'assets', 'concepts');

const CONCEPTS = [
  { slug: 'cafe-fuku', name: 'Fuku Coffee', url: 'https://cafe-nuit.vercel.app' },
  { slug: 'driftwood', name: 'Driftwood', url: 'https://guesthouse-nuit.vercel.app' },
  { slug: 'verum', name: 'Verum', url: 'https://skincare-nuit.vercel.app' },
  { slug: 'homestead', name: 'Homestead', url: 'https://furniture-nuit.vercel.app' },
  { slug: 'scentu', name: 'Scentu', url: 'https://perfume-nuit.vercel.app' },
  { slug: 'nocturne', name: 'Nocturne', url: 'https://cafe2-nuit.vercel.app' },
];

const VIEWPORT = { width: 1440, height: 900 };
const QUALITY = 82;
// Correlation between two greyscale thumbnails, sticky header cropped off. A
// plain brightness difference cannot tell two near-white sections apart; the
// correlation of their layouts can, while a pinned section that did not move
// when scrolled still scores close to 1.
const MAX_SIMILARITY = 0.8;

/** Fonts loaded and every image currently on screen settled. */
function settle(page) {
  return page.evaluate(async () => {
    try { await document.fonts.ready; } catch { /* no font loading API */ }
    const onScreen = (el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && r.width > 40 && r.height > 20;
    };
    const pending = [...document.images].filter((i) => onScreen(i) && !i.complete);
    await Promise.all(pending.map((img) => new Promise((res) => {
      img.addEventListener('load', res, { once: true });
      img.addEventListener('error', res, { once: true });
      setTimeout(res, 4000);
    })));
  });
}

const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));

/** Wheel through the whole page once so lazy images and scroll reveals have run. */
async function primeWholePage(page) {
  let last = -1;
  for (let i = 0; i < 200; i++) {
    const y = await scrollY(page);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (y >= max - 4 || (y === last && i > 3)) break;
    last = y;
    await page.mouse.wheel(0, 380);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(900);
  for (let i = 0; i < 200 && (await scrollY(page)) > 2; i++) {
    await page.mouse.wheel(0, -1400);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1200);
}

/**
 * Full-width blocks below the hero, innermost first so a wrapper around the
 * whole page never counts as a section. An innermost block is often just the
 * card row of a section, with the section's heading sitting above it, so each
 * one is extended upward to take in a heading (and the eyebrow over it) that
 * directly precedes it. Framing the row alone slices that heading off.
 */
function findSections(page) {
  return page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
    const fixedish = (el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const p = getComputedStyle(n).position;
        if (p === 'fixed' || p === 'sticky') return true;
      }
      return false;
    };

    // Sticky or fixed bar across the top — its height is where a section's
    // top edge has to sit for the heading not to disappear behind it.
    let header = 0;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      if (r.top <= 2 && r.width >= vw * 0.8 && r.height > 20 && r.height < 200) header = Math.max(header, Math.round(r.bottom));
    }

    const all = [...document.querySelectorAll('body *')].filter((el) => {
      if (fixedish(el) || el.closest('footer, nav, header')) return false;
      const r = el.getBoundingClientRect();
      if (r.width < vw * 0.85 || r.height < 280) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    const leaves = all.filter((el) => !all.some((o) => o !== el && el.contains(o)));
    const headings = [...document.querySelectorAll('h1, h2, h3')]
      .filter((h) => !h.closest('footer, nav, header') && h.getBoundingClientRect().height > 0);
    const EYEBROW = 56;

    const seen = [];
    const out = [];
    for (const el of leaves) {
      const leafTop = Math.round(docTop(el));
      let top = leafTop;
      // Only a heading that belongs to this block: the smallest element holding
      // both must hold no other block. Otherwise a card title or the previous
      // section's heading gets pulled in and the frame opens on the wrong section.
      const belongs = (hd) => {
        let common = hd.parentElement;
        while (common && !common.contains(el)) common = common.parentElement;
        return common && !leaves.some((o) => o !== el && common.contains(o));
      };
      const above = headings.filter((hd) => {
        if (!(hd.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) || el.contains(hd)) return false;
        const bottom = docTop(hd) + hd.getBoundingClientRect().height;
        return bottom <= leafTop + 10 && bottom >= leafTop - 340 && belongs(hd);
      });
      if (above.length) top = Math.min(top, Math.round(Math.min(...above.map(docTop))) - EYEBROW);
      // And never back past the end of the block above, eyebrow allowance included.
      const prevBottom = Math.max(0, ...leaves
        .map((o) => docTop(o) + o.getBoundingClientRect().height)
        .filter((b) => b <= leafTop + 1));
      top = Math.max(top, Math.round(prevBottom));
      const h = Math.round(el.getBoundingClientRect().height) + (leafTop - top);
      if (top < vh * 0.8) continue;                          // the hero
      if (seen.some((t) => Math.abs(t - top) < 60)) continue; // same block, another wrapper
      seen.push(top);
      const imagery = el.querySelectorAll('img, picture, video, canvas, svg image').length
        + [...el.querySelectorAll('*')].filter((n) => getComputedStyle(n).backgroundImage.includes('url(')).length;
      const words = (el.innerText || '').trim().split(/\s+/).filter(Boolean).length;
      const label = (el.querySelector('h1,h2,h3')?.innerText || el.className || el.tagName).toString().trim().slice(0, 48);
      // A repeated component (two carousels built from the same markup) reads as
      // the same picture twice even when the products differ.
      const sig = typeof el.className === 'string' ? el.className.trim() : '';
      out.push({ top, h, imagery, words, label, sig });
    }
    out.sort((a, b) => a.top - b.top);
    out.forEach((s, i) => { s.i = i; });
    const maxScroll = document.documentElement.scrollHeight - vh;
    return { header, vh, maxScroll, sections: out };
  });
}

/** Best-looking frames first: fits the viewport, has imagery, has a heading's worth of text. */
function rank(sections, header, vh, maxScroll) {
  const room = vh - header;
  return sections
    .filter((s) => s.top - header <= maxScroll + 4)          // can actually be scrolled to the top edge
    .map((s) => {
      // Filling the frame matters; a tall section is not penalised, because its
      // top framed at the heading is a natural view. A thin strip leaves the rest
      // of the frame to whatever follows it.
      let score = (Math.min(s.h, room) / room) * 3;
      if (s.imagery > 0) score += 2.5 + Math.min(s.imagery, 4) * 0.3;  // a preview should show design, not a paragraph
      if (s.words >= 6) score += 0.8;
      return { ...s, score };
    })
    .sort((a, b) => b.score - a.score);
}

/** Wheel until the section's top edge rests just below the sticky header. */
async function frameAt(page, section, header) {
  const target = Math.max(0, section.top - header);
  for (let pass = 0; pass < 8; pass++) {
    const y = await scrollY(page);
    const delta = target - y;
    if (Math.abs(delta) <= 3) break;
    const steps = Math.ceil(Math.abs(delta) / 360);
    for (let s = 0; s < steps; s++) {
      await page.mouse.wheel(0, delta / steps);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(700);
  }
  // Long enough for a staggered GSAP reveal to finish, not just start; the
  // screenshot call's animation freezing does not reach JS timelines.
  await page.waitForTimeout(1500);
  await settle(page);
  return scrollY(page);
}

/** Greyscale thumbnail of a JPEG buffer below the sticky header, decoded in the page. */
function fingerprint(page, buf, header) {
  return page.evaluate(async ({ b64, header }) => {
    const img = new Image();
    img.src = 'data:image/jpeg;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 64; c.height = 36;
    const g = c.getContext('2d');
    g.drawImage(img, 0, header, img.width, img.height - header, 0, 0, 64, 36);
    const d = g.getImageData(0, 0, 64, 36).data;
    const out = [];
    for (let i = 0; i < d.length; i += 4) out.push(d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11);
    return out;
  }, { b64: buf.toString('base64'), header });
}

/** Pearson correlation; a flat image correlates with nothing, so it counts as distinct. */
function similarity(a, b) {
  const mean = (v) => v.reduce((x, y) => x + y, 0) / v.length;
  const ma = mean(a), mb = mean(b);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] - ma, y = b[i] - mb;
    num += x * y; da += x * x; db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

async function capture(browser, { slug, name, url }, dry) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const shoot = (n) => page.screenshot({
    ...(dry ? {} : { path: path.join(OUT, `${slug}-${n}.jpg`) }),
    type: 'jpeg', quality: QUALITY, animations: 'disabled',
  });

  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.addStyleTag({ content: '::-webkit-scrollbar{width:0;height:0;display:none}' });
    try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* analytics */ }
    await settle(page);
    await page.waitForTimeout(1400);
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
    const hero = await shoot(1);

    await primeWholePage(page);
    const { header, vh, maxScroll, sections } = await findSections(page);
    const prints = [await fingerprint(page, hero, header)];
    const ranked = rank(sections, header, vh, maxScroll);
    if (dry) {
      console.log(`\n${slug}: header ${header}px, ${sections.length} sections`);
      for (const s of ranked) console.log(`  #${String(s.i).padStart(2)} top ${String(s.top).padStart(5)} h ${String(s.h).padStart(4)} img ${s.imagery} score ${s.score.toFixed(1)}  ${s.label}`);
    }

    // Try candidates best-first; keep the first two that are not overlapping
    // sections and do not look like the hero or each other.
    // Frames, not sections, must not overlap: each shot shows one viewport below
    // the header, so two picks closer than that would share content, and the
    // first pick must start below the hero's frame.
    const room = vh - header;
    const picked = [];
    for (const s of ranked) {
      if (picked.length === 2) break;
      if (s.top - header < vh - 40) continue;
      if (picked.some((p) => Math.abs(s.top - p.top) < room)) continue;
      if (s.sig && picked.some((p) => p.sig === s.sig)) continue;
      const y = await frameAt(page, s, header);
      const buf = await page.screenshot({ type: 'jpeg', quality: QUALITY, animations: 'disabled' });
      const fp = await fingerprint(page, buf, header);
      const closest = Math.max(...prints.map((p) => similarity(p, fp)));
      if (closest > MAX_SIMILARITY) {
        if (dry) console.log(`  × #${s.i} rejected, too similar to an earlier shot (${closest.toFixed(2)})`);
        continue;
      }
      prints.push(fp);
      picked.push({ ...s, y, buf, closest });
    }
    if (picked.length < 2) throw new Error(`${slug}: only found ${picked.length} distinct section(s)`);

    // Page order reads naturally in the quick look: shot 2 above shot 3.
    picked.sort((a, b) => a.top - b.top);
    if (!dry) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(path.join(OUT, `${slug}-2.jpg`), picked[0].buf);
      await writeFile(path.join(OUT, `${slug}-3.jpg`), picked[1].buf);
    }
    const summary = picked.map((p) => `#${p.i} "${p.label}" y=${p.y} (similarity ${p.closest.toFixed(2)})`).join('  |  ');
    console.log(`${slug.padEnd(10)} ${name.padEnd(12)} ${summary}`);
  } finally {
    await page.close();
  }
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const only = args.filter((a) => !a.startsWith('--'));
const queue = only.length ? CONCEPTS.filter((c) => only.includes(c.slug)) : CONCEPTS;
if (!queue.length) {
  console.error(`No concept matched. Known slugs: ${CONCEPTS.map((c) => c.slug).join(', ')}`);
  process.exit(1);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const concept of queue) await capture(browser, concept, dry);
} finally {
  await browser.close();
}

if (!dry) {
  const files = (await readdir(OUT)).filter((f) => f.endsWith('.jpg')).sort();
  let total = 0;
  for (const f of files) total += (await stat(path.join(OUT, f))).size;
  console.log(`\n${files.length} files in assets/concepts/, ${(total / 1024).toFixed(0)} KB total`);
}
