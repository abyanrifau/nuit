/* Services, the two reasons to pick us, and the process. */

export type Service = {
  name: string;
  /** One line, shown when a row opens. */
  short: string;
  /** A little more, for the services page. */
  body: string;
  youGet: string[];
};

export const services: Service[] = [
  {
    name: "Custom design",
    short: "Designed from scratch around your brand and your customers. No templates.",
    body: "Every site starts from a blank page. We design it around your brand, your audience and the way your customers will actually use it, on a phone as much as on a laptop.",
    youGet: [
      "A design made for your business, not a template",
      "Layouts for phone, tablet and desktop",
      "Your colours, type and photography put to work",
    ],
  },
  {
    name: "Development and launch",
    short: "Built to be fast on every screen, tested properly, then taken live.",
    body: "We build what we design, so nothing gets lost in between. Your site is fast, fully responsive and tested before it goes live on your domain.",
    youGet: [
      "A fast site that works on every screen",
      "Contact forms, menus, bookings or product orders, depending on the package",
      "Thorough testing before launch",
      "Launch on your own domain",
    ],
  },
  {
    name: "Fast turnaround",
    short: "A simple site can be live within a week of getting started.",
    body: "A simple site can be live within a week of getting started. Bigger projects take longer, and we agree the timeline with you before any work begins.",
    youGet: ["Simple sites live within a week", "A timeline agreed up front for larger projects"],
  },
  {
    name: "Hosting and support",
    short: "Once you're live, we host, maintain and update your site.",
    body: "Launch is not the end. On a hosting and support plan we host your site, keep it running, fix anything that breaks and make changes whenever your business needs them.",
    youGet: ["Hosting and domain management", "Updates and fixes", "Changes whenever you need them"],
  },
];

/** The two reasons to choose us. */
export const pillars = [
  {
    label: "Speed",
    statement: "Simple sites, live within a week.",
    body: "A simple site can be online within a week of getting started. No layers of approval, no waiting weeks for a first draft.",
  },
  {
    label: "Launch and care",
    statement: "Launched, then looked after.",
    body: "We launch your site, then host it, maintain it and update it. You run your business; you never have to deal with the tech.",
  },
];

export type Step = { name: string; title: string; body: string };

export const process: Step[] = [
  {
    name: "Talk",
    title: "We learn about your business",
    body: "What you do, who your customers are, and what the site needs to do for you. A conversation, not a questionnaire.",
  },
  {
    name: "Design",
    title: "A custom design, no templates",
    body: "We design your site from scratch, for your brand and your customers, on phone and desktop.",
  },
  {
    name: "Build and refine",
    title: "Built with you",
    body: "We build your site and refine it with you until it's ready to go live.",
  },
  {
    name: "Launch and care",
    title: "Live, then looked after",
    body: "We take it live, then host and maintain it, so you never have to deal with the tech.",
  },
];
