"use server";

import { Resend } from "resend";
import { packageLabel, validateContact, type ContactErrors, type ContactInput } from "@/lib/contact";
import { CONTACT_EMAIL } from "@/lib/site";

export type ContactResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; errors: ContactErrors }
  | { ok: false; reason: "not-configured" | "failed" };

// A sender on the studio's own domain. Resend only sends from it once
// nuit.works is verified there (see .env.example).
const DEFAULT_FROM = "Nuit Works website <forms@nuit.works>";

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails a project enquiry to the studio through Resend.
 *
 * Environment (set in Vercel > Project > Settings > Environment Variables):
 *   RESEND_API_KEY      required. Without it the form shows its "didn't go
 *                       through" message and offers a prefilled email.
 *   CONTACT_FROM_EMAIL  optional. The sender; defaults to forms@nuit.works,
 *                       which needs nuit.works verified in Resend.
 *   CONTACT_TO_EMAIL    optional. Where enquiries go; defaults to hello@nuit.works.
 */
export async function sendContact(
  input: ContactInput,
  spam: { website: string; startedAt: number },
): Promise<ContactResult> {
  // Bots fill the hidden field or submit within a moment of the page loading.
  // Tell them it worked and send nothing.
  if (spam.website || Date.now() - spam.startedAt < 2500) return { ok: true };

  const clean: ContactInput = {
    name: String(input.name ?? "").trim(),
    email: String(input.email ?? "").trim(),
    business: String(input.business ?? "").trim(),
    pkg: input.pkg ?? "",
    message: String(input.message ?? "").trim(),
  };
  const errors = validateContact(clean);
  if (Object.keys(errors).length) return { ok: false, reason: "invalid", errors };

  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "not-configured" };

  const to = process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;
  const pkg = packageLabel(clean.pkg);
  const subject = `New enquiry from ${clean.name}${clean.business ? `, ${clean.business}` : ""}`;

  const text = [
    `Name: ${clean.name}`,
    `Email: ${clean.email}`,
    `Business: ${clean.business || "Not given"}`,
    `Package: ${pkg}`,
    "",
    clean.message,
  ].join("\n");

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#111">
      <p style="margin:0 0 16px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#777">New enquiry from nuit.works</p>
      <table style="border-collapse:collapse;margin:0 0 20px">
        <tr><td style="padding:4px 16px 4px 0;color:#777">Name</td><td>${escape(clean.name)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#777">Email</td><td><a href="mailto:${escape(clean.email)}">${escape(clean.email)}</a></td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#777">Business</td><td>${escape(clean.business || "Not given")}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#777">Package</td><td>${escape(pkg)}</td></tr>
      </table>
      <p style="white-space:pre-wrap;margin:0">${escape(clean.message)}</p>
    </div>`;

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: clean.email,
      subject,
      text,
      html,
    });
    if (error) {
      console.error("[contact] Resend rejected the message:", error);
      return { ok: false, reason: "failed" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[contact] Sending failed:", err);
    return { ok: false, reason: "failed" };
  }
}
