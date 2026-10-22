// The Study in and Students from pages ("hubs"): which hub owns which main
// guide, which posts each one lists, and which hubs of the other kind it links
// to. Plain JavaScript (with JSDoc types) so `npm run test:blog` can test it.
import { destinationPath, guideHubPaths, originPath } from "./urls.mjs";

/**
 * @typedef {object} Hub
 * @property {string} slug
 * @property {string} [name]
 * @property {string} [nameInSentence]
 * @property {string | null} [guideSlug] the post shown in full on the page
 * @property {(string | null)[]} [featuredSlugs] posts listed first
 * @property {string[]} [isoCodes] destinations: the countries on the page
 * @property {string} [region] home countries: the group on /blog/
 */

/**
 * @typedef {object} HubPost
 * @property {string} slug
 * @property {string[]} [countries] destinations the post covers ("GB", "DE"...)
 * @property {(string | null)[]} [origins] home countries it is written for ("nigeria"...)
 * @property {({ slug?: string } | null)[]} [related] its "Read next" posts
 */

// Regions for grouping home countries on /blog/, in order. The Studio offers
// the same list (studio/schemaTypes/blogHubs.ts, REGION_OPTIONS).
/** @type {[string, string][]} */
export const REGIONS = [
  ["south-asia", "South Asia"],
  ["east-asia", "East Asia"],
  ["south-east-asia", "South-East Asia"],
  ["central-asia", "Central Asia"],
  ["middle-east", "The Middle East"],
  ["africa", "Africa"],
  ["europe", "Europe"],
  ["americas", "The Americas"],
  ["oceania", "Oceania"],
];

/** @template T @param {T[]} list */
const unique = (list) => [...new Set(list)];

/** @param {string[] | undefined} codes */
const codeSet = (codes) => new Set((codes ?? []).map((c) => String(c).trim().toUpperCase()));

/**
 * Tidy the hubs against the posts that are on the site:
 * - a main guide or listed post that is missing or hidden is dropped;
 * - a hub whose address repeats an earlier one of the same kind is dropped;
 * - when two hubs pick the same main guide, the first destination (then the
 *   first home country) keeps it, and the other lists it as an ordinary post.
 * Also returns the guide map: post slug -> the hub address it now lives at.
 * @template {Hub} D
 * @template {Hub} O
 * @param {D[]} destinations
 * @param {O[]} origins
 * @param {string[]} postSlugs every post on the site
 */
export function tidyHubs(destinations = [], origins = [], postSlugs = []) {
  const visible = new Set(postSlugs);
  /** @template {Hub} H @param {H[]} list */
  const clean = (list) => {
    const seen = new Set();
    /** @type {(H & { guideSlug: string | null, featuredSlugs: string[] })[]} */
    const out = [];
    for (const hub of list) {
      if (!hub?.slug || seen.has(hub.slug)) continue;
      seen.add(hub.slug);
      out.push({
        ...hub,
        guideSlug: hub.guideSlug && visible.has(hub.guideSlug) ? hub.guideSlug : null,
        featuredSlugs: /** @type {string[]} */ (unique((hub.featuredSlugs ?? []).filter((s) => s && visible.has(s)))),
      });
    }
    return out;
  };
  const d = clean(destinations);
  const o = clean(origins);
  const guides = guideHubPaths(d, o);
  /**
   * @template {Hub & { guideSlug: string | null, featuredSlugs: string[] }} H
   * @param {H} hub @param {string} path
   * @returns {H}
   */
  const keepOwnGuide = (hub, path) =>
    hub.guideSlug && guides.get(hub.guideSlug) !== path
      ? { ...hub, guideSlug: null, featuredSlugs: unique([hub.guideSlug, ...hub.featuredSlugs]) }
      : hub;
  return {
    destinations: d.map((hub) => keepOwnGuide(hub, destinationPath(hub.slug))),
    origins: o.map((hub) => keepOwnGuide(hub, originPath(hub.slug))),
    guides,
  };
}

/** A hub is ready (listed on /blog/, linked, in search) once it has its main guide. */
export const isReady = (/** @type {Hub} */ hub) => Boolean(hub.guideSlug);

/**
 * Posts listed on a hub page, in this order: the hub's own picks, the main
 * guide's "Read next" posts, then `matching` in the order given. The main guide
 * itself is never listed (the page shows it in full).
 * @template {HubPost} P
 * @param {Hub} hub
 * @param {P[]} posts every post on the site
 * @param {P[]} matching the posts that belong on this page, in order
 * @returns {P[]}
 */
function listFor(hub, posts, matching) {
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const guide = hub.guideSlug ? bySlug.get(hub.guideSlug) : undefined;
  const slugs = unique([
    ...(hub.featuredSlugs ?? []),
    ...(guide?.related ?? []).map((r) => r?.slug),
    ...matching.map((p) => p.slug),
  ]);
  return /** @type {P[]} */ (
    slugs.filter((s) => s && s !== hub.guideSlug).map((s) => bySlug.get(/** @type {string} */ (s))).filter(Boolean)
  );
}

/**
 * Posts only about this page's subject first, then posts that also cover
 * others; otherwise in the order given.
 * @template T @param {T[]} list @param {(item: T) => boolean} onlyHere
 */
const specificFirst = (list, onlyHere) => [...list.filter(onlyHere), ...list.filter((x) => !onlyHere(x))];

/**
 * Posts on a Study in page: the picks, the guide's "Read next", then every post
 * that covers one of its countries (posts only about them first). Posts written
 * for particular home countries are left out here: the page links to those
 * countries' pages instead.
 * @template {HubPost} P
 * @param {Hub} hub @param {P[]} posts every post, in display order
 */
export function destinationPosts(hub, posts) {
  const codes = codeSet(hub.isoCodes);
  const here = (/** @type {unknown} */ c) => codes.has(String(c).toUpperCase());
  const matching = posts.filter((p) => !(p.origins ?? []).some(Boolean) && (p.countries ?? []).some(here));
  return listFor(hub, posts, specificFirst(matching, (p) => (p.countries ?? []).every(here)));
}

/**
 * Posts on a Students from page: the picks, the guide's "Read next", then every
 * post written for students from this country (posts only for them first).
 * @template {HubPost} P
 * @param {Hub} hub @param {P[]} posts every post, in display order
 */
export function originPosts(hub, posts) {
  const matching = posts.filter((p) => (p.origins ?? []).includes(hub.slug));
  return listFor(hub, posts, specificFirst(matching, (p) => (p.origins ?? []).every((o) => o === hub.slug)));
}

/**
 * The Students from pages a Study in page links to: ready ones whose main guide
 * covers one of its countries.
 * @template {Hub} O
 * @param {Hub} destination @param {O[]} origins @param {HubPost[]} posts
 * @returns {O[]}
 */
export function originsFor(destination, origins, posts) {
  const codes = codeSet(destination.isoCodes);
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  return origins.filter((o) => {
    const guide = o.guideSlug ? bySlug.get(o.guideSlug) : undefined;
    return (guide?.countries ?? []).some((c) => codes.has(String(c).toUpperCase()));
  });
}

/**
 * The Study in pages a Students from page links to: ready ones that its main
 * guide covers, or every ready one when it has no guide or lists no countries.
 * @template {Hub} D
 * @param {Hub} origin @param {D[]} destinations @param {HubPost[]} posts
 * @returns {D[]}
 */
export function destinationsFor(origin, destinations, posts) {
  const ready = destinations.filter(isReady);
  const guide = origin.guideSlug ? posts.find((p) => p.slug === origin.guideSlug) : undefined;
  const codes = codeSet(guide?.countries);
  if (codes.size === 0) return ready;
  return ready.filter((d) => (d.isoCodes ?? []).some((c) => codes.has(String(c).toUpperCase())));
}

/**
 * Home countries grouped by region, in REGIONS order; unknown or missing
 * regions come last as "Other countries". Empty groups are left out.
 * @template {Hub} O
 * @param {O[]} origins
 * @returns {{ region: string, title: string, hubs: O[] }[]}
 */
export function byRegion(origins) {
  const known = new Map(REGIONS);
  const groups = REGIONS.map(([region, title]) => ({
    region,
    title,
    hubs: origins.filter((o) => o.region === region),
  }));
  groups.push({ region: "other", title: "Other countries", hubs: origins.filter((o) => !known.has(o.region ?? "")) });
  return groups.filter((g) => g.hubs.length > 0);
}

/**
 * "Study in the UK" / "Students from the UAE".
 * @param {"destination" | "origin"} kind @param {Hub} hub
 */
export const hubLabel = (kind, hub) =>
  `${kind === "destination" ? "Study in" : "Students from"} ${hub.nameInSentence?.trim() || hub.name || hub.slug}`;
