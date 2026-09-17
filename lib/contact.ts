export const CONTACT_EMAIL = "hello@nuit.works";

const params = new URLSearchParams({
  view: "cm",
  fs: "1",
  to: CONTACT_EMAIL,
  su: "New project enquiry",
  body: [
    "Hi Nuit Works,",
    "",
    "I would like to talk about a website for my business.",
    "",
    "Business name:",
    "What I am looking to build:",
    "Timeline:",
    "",
    "Thanks,",
  ].join("\n"),
});

/** Opens a Gmail compose window addressed to the studio with the message started. */
export const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?${params.toString()}`;
