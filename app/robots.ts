import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Crawlers used by search engines and AI assistants, allowed explicitly so an
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
    rules: [{ userAgent: "*", allow: "/" }, ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" }))],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
