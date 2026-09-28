"use client";

import { useEffect, useRef, useState } from "react";
import { Button, TextLink } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import {
  businessTypes,
  featureOptions,
  getPackage,
  recommend,
  suggestedFeatures,
  timelineNote,
  type BusinessType,
  type Feature,
} from "@/data/pricing";
import { contactHref } from "@/lib/contact";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Step = 0 | 1 | 2;

/*
 * A short, calm picker for anyone unsure which package they need: what kind
 * of business, then what the site needs to do (with likely features
 * suggested for that kind of business, all changeable), then a
 * recommendation. One question at a time, with a soft fade between steps.
 * Native radios and checkboxes, so it works with a keyboard and a screen
 * reader; focus moves to each new step's heading.
 */
export function PackagePicker() {
  const [step, setStep] = useState<Step>(0);
  const [shown, setShown] = useState(true);
  const [type, setType] = useState<BusinessType | null>(null);
  const [features, setFeatures] = useState<Set<Feature>>(() => new Set());
  const [suggestedFor, setSuggestedFor] = useState<BusinessType | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // After a step change, bring the new question to keyboard and screen reader users.
  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [step]);

  const goTo = (next: Step) => {
    moved.current = true;
    if (prefersReducedMotion()) {
      setStep(next);
      return;
    }
    setShown(false);
    window.setTimeout(() => {
      setStep(next);
      setShown(true);
    }, 220);
  };

  const toFeatures = () => {
    // Suggest likely features the first time a business type reaches step 2.
    if (type && suggestedFor !== type) {
      setFeatures(new Set(suggestedFeatures[type]));
      setSuggestedFor(type);
    }
    goTo(1);
  };

  const toggle = (f: Feature) =>
    setFeatures((s) => {
      const next = new Set(s);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  const startAgain = () => {
    setType(null);
    setFeatures(new Set());
    setSuggestedFor(null);
    goTo(0);
  };

  const result = recommend(features);
  const pkg = getPackage(result.id)!;
  const typeLabel = businessTypes.find((b) => b.id === type)?.label ?? "";
  const chosen = featureOptions.filter((f) => features.has(f.id)).map((f) => f.label.toLowerCase());
  const message = [
    `Business type: ${typeLabel}`,
    `What the site needs: ${chosen.length ? chosen.join(", ") : "not sure yet"}`,
    "",
    "",
  ].join("\n");

  return (
    <div className="rounded-(--radius-lg) border border-line p-6 md:p-10">
      {/* Step indicator */}
      <div className="flex items-center justify-between gap-6">
        <p className="label text-muted" aria-live="polite">
          {step < 2 ? `Step ${step + 1} of 2` : "Your package"}
        </p>
        <div aria-hidden="true" className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn(
                "h-px w-8 transition-colors duration-500",
                i <= step ? "bg-fg" : "bg-line-strong",
              )}
            />
          ))}
        </div>
      </div>

      <div
        className="mt-8 transition-opacity duration-200 ease-out md:mt-10"
        style={{ opacity: shown ? 1 : 0 }}
      >
        {step === 0 && (
          <fieldset>
            <legend className="contents">
              <h3 ref={headingRef} tabIndex={-1} className="text-h3 outline-none">
                What kind of business is it?
              </h3>
            </legend>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {businessTypes.map((b) => (
                <label key={b.id} className="picker-option">
                  <input
                    type="radio"
                    name="business-type"
                    value={b.id}
                    checked={type === b.id}
                    onChange={() => setType(b.id)}
                    className="sr-only"
                  />
                  {b.label}
                </label>
              ))}
            </div>
            <div className="mt-10 flex items-center gap-6">
              <button type="button" className="btn btn-sm disabled:opacity-40" disabled={!type} onClick={toFeatures}>
                Next
              </button>
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset>
            <legend className="contents">
              <h3 ref={headingRef} tabIndex={-1} className="text-h3 outline-none">
                What does the site need to do?
              </h3>
            </legend>
            <p className="mt-3 text-muted">
              Select all that apply. We&rsquo;ve suggested a few for a {typeLabel.toLowerCase()}; change
              them as you like.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {featureOptions.map((f) => {
                const suggested = type ? suggestedFeatures[type].includes(f.id) : false;
                return (
                  <label key={f.id} className="picker-option">
                    <input
                      type="checkbox"
                      value={f.id}
                      checked={features.has(f.id)}
                      onChange={() => toggle(f.id)}
                      className="sr-only"
                    />
                    <CheckIcon className="picker-check size-3.5 shrink-0" />
                    {f.label}
                    {suggested && <span className="text-[0.6875rem] uppercase tracking-[0.12em] opacity-60">Suggested</span>}
                  </label>
                );
              })}
            </div>
            <div className="mt-10 flex items-center gap-6">
              <button type="button" className="link" onClick={() => goTo(0)}>
                Back
              </button>
              <button type="button" className="btn btn-sm" onClick={() => goTo(2)}>
                See my package
              </button>
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <div>
            <p className="label text-muted">We&rsquo;d suggest</p>
            <h3 ref={headingRef} tabIndex={-1} className="mt-4 text-h2 outline-none">
              {pkg.name}
            </h3>
            <p className="mt-6 font-display text-h4">
              <span className="text-muted">Starting from </span>
              {pkg.price}
            </p>
            <p className="mt-2">
              <span className="text-muted">Typical timeline: </span>
              {pkg.timeline}
            </p>
            <p className="mt-1 text-small text-muted">{timelineNote}</p>
            <p className="mt-6 max-w-[34em] text-lead">{result.why}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Button href={contactHref(pkg.id, message)} size="sm">
                Send an enquiry
              </Button>
              <TextLink href={`/pricing#${pkg.id}`}>See what&rsquo;s included</TextLink>
            </div>
            <div className="mt-10 flex items-center gap-6 border-t border-line pt-6 text-small">
              <button type="button" className="link" onClick={() => goTo(1)}>
                Back
              </button>
              <button type="button" className="link text-muted" onClick={startAgain}>
                Start again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
