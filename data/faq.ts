/*
 * Frequently asked questions. Written as direct, self-contained facts so they
 * read cleanly both on the page and in the FAQPage structured data.
 */
export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "What does Nuit Works do?",
    answer:
      "Nuit Works is a two-person web design and development studio based in the Maldives. We design and build websites for small businesses, then host and maintain them after launch.",
  },
  {
    question: "How much does a website from Nuit Works cost?",
    answer:
      "Pricing is quote based and depends on the size of the project. Nuit Works offers web design at a fair price and gives you a clear quote before any work starts.",
  },
  {
    question: "Where is Nuit Works located?",
    answer:
      "Nuit Works is based in the Maldives. We also take on international projects and work with clients anywhere in the world.",
  },
  {
    question: "How long does it take to build a website?",
    answer:
      "A simple project can be live within a week of getting started. Larger projects take longer, and we agree a timeline with you when we quote.",
  },
  {
    question: "How do I contact Nuit Works, and how quickly do you reply?",
    answer:
      "Email hello@nuit.works or message @nuit.works on Instagram. We work around the clock and get back to clients as quickly as we can.",
  },
  {
    question: "Does Nuit Works host and maintain websites?",
    answer:
      "Yes. Hosting and maintenance is a subscription. Once your site is live, Nuit Works hosts and maintains it for a recurring fee, and makes updates whenever your business needs them.",
  },
  {
    question: "How many revisions are included?",
    answer:
      "Revisions are unlimited. Once we begin working together, we refine the design until you are completely satisfied.",
  },
];
