// Public address of the site, used for canonical links and structured data.
// Set NEXT_PUBLIC_SITE_URL in the hosting build settings; no trailing slash.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.hubblebubble.london"
).replace(/\/+$/, "");
