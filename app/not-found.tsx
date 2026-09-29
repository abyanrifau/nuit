import type { Metadata } from "next";
import { Button, TextLink } from "@/components/ui/Button";
import { NAV_LINKS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section data-light="page" className="px-site flex min-h-svh flex-col justify-center pt-(--header-h)">
      <p className="label enter-fade text-muted">404</p>
      <h1 className="mt-6 max-w-[12ch] text-h1">
        <span className="block">
          <span className="enter-blur block">This page</span>
        </span>
        <span className="block">
          <span className="enter-blur block" style={{ "--d": "0.08s" } as React.CSSProperties}>
            slipped away.
          </span>
        </span>
      </h1>
      <p className="enter-fade mt-8 max-w-[30em] text-lead text-muted" style={{ "--d": "0.2s" } as React.CSSProperties}>
        The link may be old, or the page has moved. Everything else is where you left it.
      </p>
      <div className="enter-fade mt-10" style={{ "--d": "0.3s" } as React.CSSProperties}>
        <Button href="/">Back to the home page</Button>
      </div>
      <nav aria-label="Main pages" className="enter-fade mt-10" style={{ "--d": "0.38s" } as React.CSSProperties}>
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-small">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <TextLink href={l.href}>{l.label[0].toUpperCase() + l.label.slice(1)}</TextLink>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
