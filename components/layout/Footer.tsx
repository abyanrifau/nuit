import { TransitionLink } from "@/components/transition/TransitionLink";
import { BackToTop } from "@/components/layout/BackToTop";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL, NAV_LINKS } from "@/lib/site";

/*
 * The footer is the last thing on every page, so it is designed as a
 * closing scene: the contact line large, the sitemap, and the wordmark set
 * across the full width at the very bottom.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer data-light="footer" className="relative overflow-hidden pt-[clamp(80px,14vh,160px)]">
      {/* Pointing at any link here softly dims the others, as in the header. */}
      <div className="footer-links px-site grid-site gap-y-14">
        <div className="col-span-12 md:col-span-6">
          <p className="label text-muted">Say hello</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="link mt-5 font-display text-[clamp(1.75rem,1.2rem+2.6vw,3.5rem)] leading-none tracking-[-0.03em]"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-6 max-w-[26em] text-muted">
            Tell us about your business and what you want to build. We reply to every message.
          </p>
        </div>

        <nav aria-label="Footer" className="col-span-6 md:col-span-2 md:col-start-8">
          <p className="label text-muted">Sitemap</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            <li>
              <TransitionLink href="/" className="link font-display lowercase">
                home
              </TransitionLink>
            </li>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <TransitionLink href={l.href} className="link font-display lowercase">
                  {l.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="col-span-6 md:col-span-3 md:col-start-10">
          <p className="label text-muted">Elsewhere</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="link">
                Instagram {INSTAGRAM_HANDLE}
              </a>
            </li>
            <li className="text-muted">Made in the Maldives</li>
          </ul>
        </div>
      </div>

      {/* The wordmark, sized to span the page. */}
      <p
        aria-hidden="true"
        className="px-site mt-[clamp(72px,12vh,140px)] select-none whitespace-nowrap font-display text-display leading-[0.8]"
      >
        Nuit Works.
      </p>

      <div className="px-site mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 text-small text-muted">
        <p>© {year} Nuit Works</p>
        <BackToTop />
      </div>
    </footer>
  );
}
