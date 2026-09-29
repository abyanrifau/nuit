import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { enterDelay } from "@/components/layout/PageHero";
import { ogImage, pageMeta } from "@/lib/metadata";
import { breadcrumbJsonLd, jsonLd } from "@/lib/structured-data";
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Contact",
  description:
    "Start a project with Nuit Works, a web design studio in the Maldives. Send a message, email hello@nuit.works or find us on Instagram at @nuit.works.",
  path: "/contact",
  image: ogImage("contact", "Start a project with Nuit Works"),
});

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]))}
      />
      <section
        data-light="contact"
        aria-labelledby="contact-title"
        className="px-site grid-site gap-y-16 pb-(--section-y) pt-[calc(var(--header-h)+clamp(64px,14vh,160px))]"
      >
        <div className="col-span-12 lg:col-span-5">
          <p className="label enter-fade text-muted">Contact</p>
          <h1 id="contact-title" className="mt-6 text-h1 md:mt-8">
            <span className="block">
              <span className="enter-blur block" style={enterDelay(0.05)}>
                Start a
              </span>
            </span>
            <span className="block">
              <span className="enter-blur block" style={enterDelay(0.13)}>
                project.
              </span>
            </span>
          </h1>
          <p className="enter-fade mt-10 max-w-[26em] text-lead text-muted" style={enterDelay(0.25)}>
            Tell us about your business and what you want to build. We&rsquo;ll get back to you to
            talk through the details and next steps.
          </p>

          <dl className="enter-fade mt-14 grid gap-6 border-t border-line pt-8" style={enterDelay(0.32)}>
            <div>
              <dt className="label text-muted">Email</dt>
              <dd className="mt-2">
                <a href={`mailto:${CONTACT_EMAIL}`} className="link font-display text-h4">
                  {CONTACT_EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="label text-muted">Instagram</dt>
              <dd className="mt-2">
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="link font-display text-h4">
                  {INSTAGRAM_HANDLE}
                </a>
              </dd>
            </div>
            <div>
              <dt className="label text-muted">Studio</dt>
              <dd className="mt-2 text-muted">
                Maldives, working worldwide.
              </dd>
            </div>
          </dl>
        </div>

        <div className="enter-fade col-span-12 lg:col-span-6 lg:col-start-7 lg:pt-4" style={enterDelay(0.2)}>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
