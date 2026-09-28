"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { sendContact } from "@/app/contact/actions";
import { Magnetic } from "@/components/ui/Magnetic";
import { ArrowIcon } from "@/components/ui/icons";
import {
  mailtoFallback,
  PACKAGE_OPTIONS,
  validateContact,
  type ContactErrors,
  type ContactInput,
  type PackageValue,
} from "@/lib/contact";
import { CONTACT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "not-configured" | "failed";

const EMPTY: ContactInput = { name: "", email: "", business: "", pkg: "", message: "" };

export function ContactForm() {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactInput, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [sentTo, setSentTo] = useState<{ name: string; email: string } | null>(null);
  const startedAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // A package picked on the pricing page arrives as ?package=business, and
  // the package picker can start the message too (?message=...). Both stay
  // editable.
  useEffect(() => {
    startedAt.current = Date.now();
    const params = new URLSearchParams(window.location.search);
    const p = params.get("package") as PackageValue | null;
    const m = params.get("message");
    const pkg = p && PACKAGE_OPTIONS.some((o) => o.value === p) ? p : null;
    if (!pkg && !m) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only readable on the client
    setValues((v) => ({ ...v, ...(pkg ? { pkg } : {}), ...(m ? { message: m.slice(0, 2000) } : {}) }));
  }, []);

  // Move focus to whatever just appeared, which also brings it into view.
  useEffect(() => {
    if (status === "sent") successRef.current?.focus();
    if (status === "not-configured" || status === "failed") alertRef.current?.focus();
  }, [status]);

  const set = (key: keyof ContactInput) => (value: string) => {
    const next = { ...values, [key]: value } as ContactInput;
    setValues(next);
    // Once a field has been left, keep its message current as the visitor types.
    if (touched[key]) setErrors(validateContact(next));
  };
  const blur = (key: keyof ContactInput) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    const errs = validateContact(values);
    setErrors((e) => ({ ...e, [key]: errs[key] }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    const errs = validateContact(values);
    setErrors(errs);
    setTouched({ name: true, email: true, business: true, pkg: true, message: true });
    const first = (Object.keys(errs) as (keyof ContactInput)[])[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus("sending");
    const result = await sendContact(values, {
      website: honeypot.current?.value ?? "",
      startedAt: startedAt.current,
    }).catch(() => ({ ok: false as const, reason: "failed" as const }));

    if (result.ok) {
      setSentTo({ name: values.name.trim().split(/\s+/)[0], email: values.email.trim() });
      setStatus("sent");
      return;
    }
    if (result.reason === "invalid") {
      setErrors(result.errors);
      setStatus("idle");
      return;
    }
    setStatus(result.reason);
  };

  if (status === "sent" && sentTo) {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className="contact-success outline-none">
        <svg viewBox="0 0 220 90" fill="none" aria-hidden="true" className="w-44">
          <defs>
            <linearGradient id="sent-fan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#b0604f" />
              <stop offset="0.25" stopColor="#b38350" />
              <stop offset="0.45" stopColor="#aea46a" />
              <stop offset="0.65" stopColor="#62a0ad" />
              <stop offset="0.85" stopColor="#3a7cb0" />
              <stop offset="1" stopColor="#7a68a6" />
            </linearGradient>
          </defs>
          <path className="sent-beam" d="M0 52 L58 47" stroke="#fff" strokeWidth="1.2" pathLength="1" />
          <path className="sent-fan" d="M86 48 L220 22 L220 78 Z" fill="url(#sent-fan)" />
          <path className="sent-prism" d="M72 22 L94 62 L50 62 Z" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" pathLength="1" />
        </svg>
        <h2 className="mt-10 text-h2">Thank you, {sentTo.name}.</h2>
        <p className="mt-6 max-w-[28em] text-lead text-muted">
          Your message is on its way. We&rsquo;ll reply to <span className="text-fg">{sentTo.email}</span> as
          soon as we can.
        </p>
        <button
          type="button"
          className="link mt-10"
          onClick={() => {
            setValues(EMPTY);
            setErrors({});
            setTouched({});
            setStatus("idle");
            startedAt.current = Date.now();
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-label="Project enquiry" className="flex flex-col gap-9">
      <div className="grid gap-9 md:grid-cols-2 md:gap-x-(--gutter)">
        <Field label="Your name" error={touched.name ? errors.name : undefined}>
          {(p) => (
            <input
              {...p}
              name="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={(e) => set("name")(e.target.value)}
              onBlur={blur("name")}
            />
          )}
        </Field>
        <Field label="Email" error={touched.email ? errors.email : undefined}>
          {(p) => (
            <input
              {...p}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => set("email")(e.target.value)}
              onBlur={blur("email")}
            />
          )}
        </Field>
        <Field label="Business name" optional error={touched.business ? errors.business : undefined}>
          {(p) => (
            <input
              {...p}
              name="business"
              type="text"
              autoComplete="organization"
              value={values.business}
              onChange={(e) => set("business")(e.target.value)}
              onBlur={blur("business")}
            />
          )}
        </Field>
        <Field label="Package" optional error={touched.pkg ? errors.pkg : undefined}>
          {(p) => (
            <div className="relative">
              <select
                {...p}
                name="pkg"
                value={values.pkg}
                onChange={(e) => set("pkg")(e.target.value)}
                onBlur={blur("pkg")}
                className={cn(p.className, "appearance-none pr-10", !values.pkg && "text-muted")}
              >
                <option value="">Choose one</option>
                {PACKAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="pointer-events-none absolute right-1 top-1/2 size-4 -translate-y-1/2 text-muted"
              >
                <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </div>
          )}
        </Field>
      </div>

      <Field label="Tell us about your project" error={touched.message ? errors.message : undefined}>
        {(p) => (
          <textarea
            {...p}
            name="message"
            rows={5}
            value={values.message}
            onChange={(e) => set("message")(e.target.value)}
            onBlur={blur("message")}
            placeholder="What your business does, what you want the site to do, and any timing."
            className={cn(p.className, "resize-y leading-relaxed")}
          />
        )}
      </Field>

      {/* Honeypot: hidden from people and screen readers, irresistible to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      {(status === "not-configured" || status === "failed") && (
        <div ref={alertRef} tabIndex={-1} role="alert" className="rounded-(--radius) border border-line-strong bg-raised/70 p-6 outline-none">
          <p className="font-display text-h4">
            {status === "not-configured" ? "The form isn't connected just yet." : "That didn't go through."}
          </p>
          <p className="mt-3 text-muted">
            {status === "not-configured"
              ? "Nothing is lost. Email us directly and we'll reply from there. We've written the email for you:"
              : "Please try again in a moment, or email us directly. We've written the email for you:"}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Magnetic>
              <a href={mailtoFallback(CONTACT_EMAIL, values)} className="btn btn-sm">
                Open in your email app
              </a>
            </Magnetic>
            <a href={`mailto:${CONTACT_EMAIL}`} className="link">
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-line pt-8">
        <p className="max-w-[26em] text-small text-muted">
          We&rsquo;ll only use your details to reply to you.
        </p>
        <Magnetic>
          <button type="submit" disabled={sending} aria-busy={sending} className="btn min-w-[200px] disabled:cursor-wait">
            {sending ? (
              <span className="flex items-center gap-3">
                Sending
                <span aria-hidden="true" className="sending-dots">
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Send message
                <ArrowIcon className="arrow size-4" />
              </span>
            )}
          </button>
        </Magnetic>
      </div>
      <p aria-live="polite" className="sr-only">
        {sending ? "Sending your message" : ""}
      </p>
    </form>
  );
}

type FieldProps = { id: string; className: string; "aria-invalid"?: boolean; "aria-describedby"?: string };

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: (props: FieldProps) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="label flex justify-between text-muted">
        <span>{label}</span>
        {optional && <span className="normal-case tracking-normal">Optional</span>}
      </label>
      {children({
        id,
        className: cn(
          "field mt-3 w-full border-b bg-transparent pb-3 text-[1.1875rem] text-fg outline-none transition-colors duration-300",
          error ? "border-[#e0907f]" : "border-line-strong focus:border-fg",
        ),
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : undefined,
      })}
      <p id={errorId} className={cn("mt-2 min-h-[1.25rem] text-small text-[#e8a597]", !error && "invisible")}>
        {error || " "}
      </p>
    </div>
  );
}
