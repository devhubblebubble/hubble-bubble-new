import type { MetadataRoute } from "next";
import { noIndex, siteUrl } from "@/lib/site";

export const dynamic = "force-static";

// Search and AI answer engines we want to let in explicitly. The "*" rule
// already allows everyone; naming these makes the intent clear.
const AI_SEARCH_BOTS = [
  "Googlebot",
  "Bingbot",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  if (noIndex) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_SEARCH_BOTS, allow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
