// Where each blog page lives. Plain JavaScript (with JSDoc types) so the site,
// the build and `npm run test:blog` all use the same rules.
//
//   /blog/                          the blog front page
//   /blog/topics/<topic>/           a topic (choosing, applying, visas...)
//   /blog/study-in/<destination>/   a destination hub (uk, usa, europe...)
//   /blog/students-from/<country>/  a home-country hub (india, nigeria...)
//   /blog/<post>/                   a post
//
// A post that is the main guide of a hub lives only at the hub's address, so
// every link to it (cards, "Read next", links inside post text) goes there,
// and its old /blog/<post>/ address redirects to the hub.

/** @param {string} slug */
export const postPath = (slug) => `/blog/${slug}/`;
/** @param {string} slug */
export const topicPath = (slug) => `/blog/topics/${slug}/`;
/** @param {string} slug */
export const destinationPath = (slug) => `/blog/study-in/${slug}/`;
/** @param {string} slug */
export const originPath = (slug) => `/blog/students-from/${slug}/`;

/**
 * @typedef {{ slug: string, guideSlug?: string | null }} HubRef
 */

/**
 * Post slug -> hub address, for every hub whose main guide is that post.
 * If two hubs share a guide, the first destination wins, then the first home country.
 * @param {HubRef[]} [destinations]
 * @param {HubRef[]} [origins]
 * @returns {Map<string, string>}
 */
export function guideHubPaths(destinations = [], origins = []) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const d of destinations) {
    if (d?.slug && d.guideSlug && !map.has(d.guideSlug)) map.set(d.guideSlug, destinationPath(d.slug));
  }
  for (const o of origins) {
    if (o?.slug && o.guideSlug && !map.has(o.guideSlug)) map.set(o.guideSlug, originPath(o.slug));
  }
  return map;
}

/**
 * The address of a post: its hub when it is a hub's main guide, else /blog/<slug>/.
 * @param {string} slug
 * @param {Map<string, string>} [guides]
 */
export const postHref = (slug, guides) => guides?.get(slug) ?? postPath(slug);

// /blog/<one-segment>/ on this site, with or without the domain, slash, query or hash.
const POST_LINK = /^(?:https?:\/\/(?:www\.)?hubblebubble\.(?:club|london))?\/blog\/([a-z0-9-]+)\/?([?#].*)?$/i;

/**
 * A link inside post text: an old address of a hub's guide becomes the hub's
 * address (keeping any #section); every other link is returned unchanged.
 * @param {string | undefined} href
 * @param {Map<string, string>} [guides]
 * @returns {string | undefined}
 */
export function rewriteBlogHref(href, guides) {
  if (!href || !guides?.size) return href;
  const match = POST_LINK.exec(href.trim());
  if (!match) return href;
  const hub = guides.get(match[1].toLowerCase());
  return hub ? hub + (match[2] ?? "") : href;
}

/**
 * The lines of Cloudflare's _redirects file:
 * - every old guide address (with and without the trailing slash) to its hub,
 *   permanently (301);
 * - /blog/study-in/ and /blog/students-from/ (which have no page of their own)
 *   to their lists on /blog/, temporarily (302), so a page can be added there later.
 * Format: https://developers.cloudflare.com/workers/static-assets/redirects/
 * @param {Map<string, string>} guides
 * @returns {string}
 */
export function redirectsFile(guides) {
  const lines = [
    "# Made at build time by src/app/%5Fredirects/route.ts. Do not edit by hand:",
    "# a post that is the main guide of a Study in or Students from page lives at",
    "# that page's address, so its own /blog/<post>/ address sends people there.",
  ];
  for (const [slug, hub] of [...guides.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`${postPath(slug)} ${hub} 301`, `/blog/${slug} ${hub} 301`);
  }
  for (const [section, anchor] of [["study-in", "study-in"], ["students-from", "students-from"]]) {
    lines.push(`/blog/${section}/ /blog/#${anchor} 302`, `/blog/${section} /blog/#${anchor} 302`);
  }
  return `${lines.join("\n")}\n`;
}
