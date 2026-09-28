/*
 * The contact form's shape and rules, shared by the form (instant, friendly
 * feedback) and the server action (the check that counts).
 */

export const PACKAGE_OPTIONS = [
  { value: "essential", label: "Essential" },
  { value: "business", label: "Business" },
  { value: "commerce", label: "Commerce" },
  { value: "standard", label: "Standard hosting" },
  { value: "priority", label: "Priority hosting" },
  { value: "unsure", label: "Not sure yet" },
] as const;

export type PackageValue = (typeof PACKAGE_OPTIONS)[number]["value"] | "";

export type ContactInput = {
  name: string;
  email: string;
  business: string;
  pkg: PackageValue;
  message: string;
};

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name) errors.name = "Please tell us your name.";
  else if (name.length > 100) errors.name = "That name is a little long. Could you shorten it?";

  if (!email) errors.email = "We need an email address to reply to.";
  else if (!EMAIL.test(email) || email.length > 200) errors.email = "That email address doesn't look quite right.";

  if (input.business.trim().length > 120) errors.business = "That's a long name. Could you shorten it a little?";

  if (input.pkg && !PACKAGE_OPTIONS.some((p) => p.value === input.pkg)) errors.pkg = "Please choose one of the options.";

  if (message.length < 10) errors.message = "Tell us a little more. A sentence or two is plenty.";
  else if (message.length > 5000) errors.message = "That's a long message. Could you trim it a little?";

  return errors;
}

export const packageLabel = (value: PackageValue) =>
  PACKAGE_OPTIONS.find((p) => p.value === value)?.label ?? "Not specified";

/** A contact page link with a package preselected and, optionally, a message started. */
export function contactHref(pkg: PackageValue, message?: string) {
  const params = new URLSearchParams();
  if (pkg) params.set("package", pkg);
  if (message) params.set("message", message);
  const q = params.toString();
  return q ? `/contact?${q}` : "/contact";
}

/** A mailto link with the visitor's message already written, for when the form can't send. */
export function mailtoFallback(to: string, input: ContactInput) {
  const subject = `New project enquiry${input.business ? ` from ${input.business}` : ""}`;
  const body = [
    input.message.trim(),
    "",
    `Name: ${input.name.trim()}`,
    input.business.trim() ? `Business: ${input.business.trim()}` : "",
    `Package: ${packageLabel(input.pkg)}`,
  ]
    .filter((l, i, a) => l !== "" || a[i - 1] !== "")
    .join("\n");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`;
}
