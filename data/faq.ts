/*
 * Frequently asked questions. Written as direct, self-contained answers so
 * they read cleanly on the page and in the FAQPage structured data.
 */
export type Faq = { question: string; answer: string };

export const faqs: Faq[] = [
  {
    question: "What does Nuit Works do?",
    answer:
      "Nuit Works is a web design and development studio based in the Maldives. We design and build websites for businesses, then host and maintain them after launch.",
  },
  {
    question: "How much does a website cost?",
    answer:
      "There are three website packages, each with a starting price: Essential from MVR 3,500, Business from MVR 7,500 and Commerce from MVR 12,500. The final price is quoted based on the size of the project, and you get a clear quote before any work starts. Hosting and support is a separate monthly plan, from MVR 300 a month, and domain and hosting fees are quoted separately.",
  },
  {
    question: "How long does it take to build a website?",
    answer:
      "Typical timelines are about 1 week for Essential, about 2 to 3 weeks for Business and about 3 to 5 weeks for Commerce. These are estimates; the actual timeline is quoted based on the size of the project.",
  },
  {
    question: "Do you host and maintain websites?",
    answer:
      "Yes. Once your site is live, we host it and look after it on a monthly plan. Standard, from MVR 300 a month, covers hosting and domain management, fixes, security updates and backups, small content edits and regular check-ups. Priority, from MVR 500 a month, adds faster response times and handles your requests first.",
  },
  {
    question: "How does payment work?",
    answer:
      "A portion of the payment is taken upfront before work begins, depending on the size of the project. The rest is due as agreed in your quote.",
  },
  {
    question: "Where are you based? Do you work with clients abroad?",
    answer:
      "We're based in the Maldives and happily take on international projects. We work with clients anywhere in the world.",
  },
  {
    question: "How do I get in touch, and how quickly do you reply?",
    answer:
      "Send us a message through the contact page, email hello@nuit.works, or message @nuit.works on Instagram. We work around the clock and reply as quickly as we can.",
  },
];
