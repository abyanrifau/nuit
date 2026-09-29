import { faqs } from "@/data/faq";
import { packages, planIncludes, planNote, plans, pricingNotes } from "@/data/pricing";
import { process, services } from "@/data/studio";
import { work } from "@/data/work";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL, SITE_URL } from "@/lib/site";

/*
 * /llms-full.txt: the full text of the main pages in plain markdown, for AI
 * assistants and AI search. Built from the same data as the pages, so it
 * always says exactly what the site says. Generated once at build time.
 */
export const dynamic = "force-static";

function build() {
  const lines: string[] = [];
  const add = (...l: string[]) => lines.push(...l);

  add(
    "# Nuit Works",
    "",
    "> Nuit Works is a web design and development studio based in the Maldives. We design, build, host and maintain websites for businesses, and we take on international projects.",
    "",
    `Website: ${SITE_URL}`,
    `Email: ${CONTACT_EMAIL}`,
    `Instagram: ${INSTAGRAM_HANDLE} (${INSTAGRAM_URL})`,
    "Location: Maldives (clients worldwide)",
    "",
    "## Who we work with",
    "",
    "Businesses of every kind, including cafes, restaurants, resorts, guesthouses, dive centers, travel agencies, shops, salons and gyms, in the Maldives and abroad. If you have customers to reach, we can help you reach them online.",
    "",
    "## Services",
    "",
  );
  for (const s of services) {
    add(`### ${s.name}`, "", s.body, "", ...s.youGet.map((g) => `- ${g}`), "");
  }

  add("## How a project works", "");
  process.forEach((p, i) => add(`${i + 1}. ${p.name}: ${p.title}. ${p.body}`));
  add("");

  add("## Website packages", "", "Starting prices. Every project is quoted on its size.", "");
  for (const p of packages) {
    add(`### ${p.name}: from ${p.price}`, "", `Who it's for: ${p.goodFor}`, "", ...p.includes.map((i) => `- ${i}`));
    if (p.note) add("", p.note);
    add("", `Typical timeline: ${p.timeline}.`, "");
  }

  add("## Hosting and support", "", "Monthly plans, separate from the website packages.", "");
  for (const p of plans) {
    const what = p.adds ? `Everything in Standard, plus: ${p.adds.join(", ").toLowerCase()}.` : `${planIncludes.join(", ")}.`;
    add(`- ${p.name}: ${p.price} a month. ${what}`);
  }
  add("", planNote, "");

  add("## Good to know", "", ...pricingNotes.map((n) => `- ${n}`), "");

  add("## Frequently asked questions", "");
  for (const f of faqs) add(`### ${f.question}`, "", f.answer, "");

  add(
    "## Work",
    "",
    "The portfolio is six concept websites the studio designed and built itself to show what it can do. They are concepts, not client projects.",
    "",
  );
  for (const w of work) {
    add(`### ${w.name} (${w.kind.toLowerCase()}, ${w.industry.toLowerCase()})`, "", `Case study: ${SITE_URL}/work/${w.slug}`, "", w.summary, "", w.brief, "", w.result, "");
  }

  add(
    "## Contact",
    "",
    `Send a message through ${SITE_URL}/contact, email ${CONTACT_EMAIL}, or message ${INSTAGRAM_HANDLE} on Instagram.`,
    "",
  );
  return lines.join("\n");
}

export function GET() {
  return new Response(build(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
