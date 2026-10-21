// Public address of the site, used for canonical links and structured data.
// Jevin chose hubblebubble.club (21 October 2026). NEXT_PUBLIC_SITE_URL in the
// hosting build settings overrides it; no trailing slash.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://hubblebubble.club"
).replace(/\/+$/, "");

// Set NOINDEX=1 on test deployments so search engines and AI crawlers skip
// them. Never set it on the live site.
export const noIndex = process.env.NOINDEX === "1";
