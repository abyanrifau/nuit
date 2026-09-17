import type { MetadataRoute } from "next";

const SITE_URL = "https://nuit.works";

// Crawlers used by AI assistants and search engines, allowed explicitly so an
// upstream default never blocks them.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "Google-Extended",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "CCBot",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "DuckAssistBot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/lab"] },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/", disallow: ["/lab"] })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
