#!/usr/bin/env node
// Checks the starting blog posts (content/blog/<slug>.md) for format and
// house style before they are imported into Sanity.
//
//   npm run lint:blog                       every post in content/blog
//   npm run lint:blog -- content/blog/x.md  one or more files
//
// ERROR lines must be fixed (the exit code is 1 if there are any).
// WARN lines are worth a look.
//
// What it checks:
// - The front matter is valid JSON with the keys the converter reads
//   (content/seed/blog.mjs), the slug matches the file name, and the topic,
//   "countries", "origins" and "related" values exist.
// - House style: no em or en dashes, no exclamation marks, none of the banned
//   words and phrases ("rather than", "navigate", "journey" and the rest, below).
// - Markdown the converter supports: ## and ### headings, paragraphs, flat
//   lists, **bold**, links and pipe tables. No H1, images, HTML, quotes,
//   italics or horizontal rules.
// - Links: country and topic pages exist, other posts exist and end with a
//   slash, and the closing paragraph links to /contact/.
// - Sources: each has a title and a full address; sites that look like agents,
//   aggregators, forums or blogs are flagged.
// - Lengths: title, Google description, card text, "In short", questions,
//   the first paragraph and the whole post.
//
// It cannot check that a fact is true. Every post still needs a second person
// to open each source and check each claim.

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = path.join(root, "content", "blog");
const seed = (file) => JSON.parse(readFileSync(path.join(root, "content", "seed", file), "utf8"));

const TOPICS = new Set(seed("blog-topics.json").map((t) => t.slug));
const DESTINATIONS = new Set(seed("blog-destinations.json").map((d) => d.slug));
const ORIGINS = new Set(seed("blog-origins.json").map((o) => o.slug));

// The Studio's list of countries for "Countries this post covers".
const schema = readFileSync(path.join(root, "studio", "schemaTypes", "blog.ts"), "utf8");
const countryBlock = schema.match(/export const COUNTRY_OPTIONS = \[([\s\S]*?)\];/);
const COUNTRIES = new Set(countryBlock ? [...countryBlock[1].matchAll(/value: "([A-Z]{2})"/g)].map((m) => m[1]) : []);

const allFiles = readdirSync(postsDir).filter((f) => f.endsWith(".md")).sort();
const POSTS = new Set(allFiles.map((f) => f.replace(/\.md$/, "")));

const SITE_PAGES = new Set(["/contact/", "/services/", "/about/", "/blog/", "/recruitment/", "/stories/"]);

const BANNED_WORDS = [
  "navigate", "navigating", "landscape", "delve", "journey", "crucial", "vital",
  "essential", "seamless", "seamlessly", "unlock", "empower", "embark", "realm",
  "tailored", "leverage", "robust", "moreover", "furthermore", "additionally",
  "in conclusion", "game-changer", "game changer", "dive into", "ever-evolving",
  "holistic", "myriad", "plethora", "boasts", "nestled", "hidden gem",
  "dream destination", "in today's", "rest assured", "look no further",
];
const BANNED_PATTERNS = [
  [/rather than/g, "'rather than' construction"],
  [/\bnot just\b/g, "'not just ... but' construction"],
  [/\bnot only\b/g, "'not only ... but also' construction"],
  [/\bit'?s not about\b/g, "'it's not about X' construction"],
  [/\bwhether you'?re\b/g, "'whether you're X or Y' construction"],
];

const REQUIRED = {
  title: "string", slug: "string", topic: "string", pillar: "boolean", description: "string",
  excerpt: "string", countries: "array", published: "string", reviewed: "string",
  keyPoints: "array", faq: "array", sources: "array", related: "array",
};

// Government, university and other official addresses pass without a look.
const OFFICIAL_HOST = [
  /(^|\.)(gov|govt|gouv|gob|go|gv)\.[a-z]{2}$/, // gov.uk, govt.nz, gouv.fr, gob.es, go.kr
  /(^|\.)gov\.[a-z]{2}\.[a-z]{2}$/,
  /\.(gov|edu|mil|int)$/,
  /(^|\.)(ac|edu)\.[a-z]{2}$/, // ac.uk, edu.au, ac.ae
  /(^|\.)europa\.eu$/,
  /(^|\.)diplo\.de$/,
  /(^|\.)nic\.in$/,
  /(^|\.)(canada\.ca|gc\.ca|u\.ae)$/,
];
// Sites that are agents, aggregators, forums, blogs or social media.
const DOUBTFUL_HOST = [
  /(^|\.)(idp\.com|aeccglobal\.[a-z.]+|leverageedu\.com|yocket\.com|shiksha\.com|collegedunia\.com|careers360\.com|upgrad\.com|upgradabroad\.com|mastersportal\.com|bachelorsportal\.com|phdportal\.com|studyportals\.com|applyboard\.com|msmunify\.com|gradright\.com|edwiseinternational\.com|si-uk\.com|unifrog\.org)$/,
  /(^|\.)(wikipedia\.org|reddit\.com|quora\.com|medium\.com|substack\.com|blogspot\.com|wordpress\.com|facebook\.com|instagram\.com|tiktok\.com|youtube\.com|x\.com|twitter\.com)$/,
  /blog|forum|consult|overseas|abroad/,
];

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

function lint(file) {
  const errors = [];
  const warns = [];
  const name = path.basename(file);
  const text = readFileSync(file, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) {
    console.log(`ERROR ${name}: the file must start with '---', the JSON front matter, then '---'`);
    return 1;
  }
  const [, rawMeta, body] = m;
  let meta;
  try {
    meta = JSON.parse(rawMeta);
  } catch (e) {
    console.log(`ERROR ${name}: the front matter is not valid JSON: ${e.message}`);
    return 1;
  }

  for (const [key, type] of Object.entries(REQUIRED)) {
    if (!(key in meta)) errors.push(`missing key '${key}'`);
    else if (type === "array" ? !Array.isArray(meta[key]) : typeof meta[key] !== type) {
      errors.push(`'${key}' should be ${type === "array" ? "a list" : `a ${type}`}`);
    }
  }
  const slug = meta.slug ?? "";
  const stem = name.replace(/\.md$/, "");
  if (slug !== stem) errors.push(`slug '${slug}' must match the file name '${stem}'`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push("slug: lower-case letters, numbers and single hyphens only");
  if (["topics", "study-in", "students-from"].includes(slug)) errors.push(`slug '${slug}' is taken by other blog pages`);
  if (!TOPICS.has(meta.topic)) errors.push(`topic must be one of: ${[...TOPICS].join(", ")}`);
  for (const key of ["published", "reviewed"]) {
    if (typeof meta[key] === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(meta[key])) errors.push(`'${key}' must be a date like 2026-10-22`);
  }

  const title = meta.title ?? "";
  if (title.length > 70) warns.push(`title is ${title.length} characters (aim for 65 or fewer)`);
  const desc = meta.description ?? "";
  if (desc.length < 110 || desc.length > 160) warns.push(`description is ${desc.length} characters (aim for 120 to 155)`);
  if ((meta.excerpt ?? "").length > 220) warns.push("excerpt is over 220 characters");
  const kp = Array.isArray(meta.keyPoints) ? meta.keyPoints : [];
  if (kp.length < 3 || kp.length > 6) warns.push(`keyPoints has ${kp.length} items (3 to 5)`);
  const faq = Array.isArray(meta.faq) ? meta.faq : [];
  if (faq.length < 3 || faq.length > 6) warns.push(`faq has ${faq.length} items (3 to 5)`);
  faq.forEach((item, i) => {
    if (!item || typeof item !== "object" || !item.q || !item.a) errors.push(`faq[${i}] needs 'q' and 'a'`);
  });

  const countries = Array.isArray(meta.countries) ? meta.countries : [];
  for (const c of countries) {
    if (!COUNTRIES.has(c)) errors.push(`country '${c}' is not in the Studio's list (studio/schemaTypes/blog.ts, COUNTRY_OPTIONS)`);
  }
  if ("origins" in meta && !Array.isArray(meta.origins)) errors.push("'origins' should be a list of home-country slugs");
  const origins = Array.isArray(meta.origins) ? meta.origins : [];
  for (const o of origins) {
    if (!ORIGINS.has(o)) errors.push(`origin '${o}' is not a Students from page: ${[...ORIGINS].join(", ")}`);
  }
  if (meta.topic === "home-country" && origins.length === 0) {
    errors.push("a home-country guide needs 'origins' (the home countries it is written for)");
  }

  const sources = Array.isArray(meta.sources) ? meta.sources : [];
  if (sources.length < 3) warns.push(`only ${sources.length} sources`);
  sources.forEach((s, i) => {
    if (!s || typeof s !== "object" || !s.title || !/^https?:\/\//.test(s.url ?? "")) {
      errors.push(`sources[${i}] needs a 'title' and a full 'url' (https://...)`);
      return;
    }
    const host = new URL(s.url).hostname.toLowerCase().replace(/^www\d?\./, "");
    if (!OFFICIAL_HOST.some((re) => re.test(host)) && DOUBTFUL_HOST.some((re) => re.test(host))) {
      warns.push(`source looks like an agent, aggregator, forum or blog, use the official page: ${s.url}`);
    }
  });

  const related = Array.isArray(meta.related) ? meta.related : [];
  for (const r of related) {
    if (r === slug) errors.push("a post cannot be in its own Read next");
    else if (!POSTS.has(r)) warns.push(`Read next '${r}' is not in content/blog (fine only if the post exists in the Studio)`);
  }

  // House style, over the whole file (front matter text included).
  text.split("\n").forEach((line, i) => {
    if (line.includes("—")) errors.push(`line ${i + 1}: em dash: ${line.trim().slice(0, 90)}`);
    if (line.includes("–")) errors.push(`line ${i + 1}: en dash: ${line.trim().slice(0, 90)}`);
  });
  const lowered = text.toLowerCase();
  for (const w of BANNED_WORDS) {
    const re = new RegExp(`(?<![a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z])`, "g");
    for (const mm of lowered.matchAll(re)) errors.push(`line ${lineOf(lowered, mm.index)}: banned word '${w}'`);
  }
  for (const [re, label] of BANNED_PATTERNS) {
    for (const mm of lowered.matchAll(re)) errors.push(`line ${lineOf(lowered, mm.index)}: ${label}`);
  }

  // Markdown the converter supports.
  body.split("\n").forEach((line, i) => {
    const n = i + 1;
    const s = line.trim();
    if (/^#\s/.test(s)) errors.push(`body line ${n}: no # heading in the body (the title is the page heading), use ## or ###`);
    if (/^#{4,}\s/.test(s)) errors.push(`body line ${n}: only ## and ### headings`);
    if (s.startsWith(">")) errors.push(`body line ${n}: no quotes (lines starting with >)`);
    if (s.includes("![")) errors.push(`body line ${n}: no images`);
    if (/<[a-zA-Z/][^>]*>/.test(s)) errors.push(`body line ${n}: no HTML`);
    if (/^\s+([-*]|\d+\.)\s/.test(line)) errors.push(`body line ${n}: no nested lists`);
    if (["---", "***", "___"].includes(s)) errors.push(`body line ${n}: no horizontal rules`);
    if (s.replace(/\]\([^)]*\)/g, "]").includes("!")) warns.push(`body line ${n}: exclamation mark`);
    if (/(?<!\*)\*(?!\*)[^*]+\*(?!\*)/.test(s) && !/^[-*]\s/.test(s)) warns.push(`body line ${n}: a single * looks like italics (not supported)`);
  });

  for (const mm of body.matchAll(/\]\(([^)]+)\)/g)) {
    const href = mm[1].trim();
    const hub = href.match(/^\/blog\/(study-in|students-from|topics)\/([a-z0-9-]+)\/$/);
    if (hub) {
      const [, kind, page] = hub;
      const known = { "study-in": DESTINATIONS, "students-from": ORIGINS, topics: TOPICS }[kind];
      if (!known.has(page)) errors.push(`link to a page that does not exist: ${href}`);
    } else if (href.startsWith("/blog/") && href !== "/blog/") {
      const parts = href.replace(/^\/|\/$/g, "").split("/");
      if (!href.endsWith("/")) errors.push(`blog links end with a slash: ${href}`);
      else if (parts.length !== 2) errors.push(`odd blog link: ${href}`);
      else if (!POSTS.has(parts[1])) warns.push(`link to a post that is not in content/blog (fine only if it exists in the Studio): ${href}`);
    } else if (href.startsWith("/") && !SITE_PAGES.has(href)) {
      warns.push(`link to a page that may not exist: ${href}`);
    } else if (!/^(\/|https?:\/\/|#|mailto:)/.test(href)) {
      errors.push(`odd link: ${href}`);
    }
  }
  if (!body.includes("(/contact/)")) warns.push("no link to /contact/ in the closing paragraph");

  const words = (body.match(/[A-Za-z0-9£€$%][\w'’.,%-]*/g) ?? []).length;
  const [lo, hi] = meta.pillar ? [1400, 2300] : [850, 2300];
  if (words < lo || words > hi) warns.push(`about ${words} words (aim for ${lo} to ${hi})`);
  const firstPara =
    body
      .trim()
      .split(/\n\s*\n/)
      .find((p) => p.trim() && !/^\s*(#|-|\d+\.|\|)/.test(p)) ?? "";
  const fpWords = firstPara.split(/\s+/).filter(Boolean).length;
  if (fpWords < 30 || fpWords > 90) warns.push(`first paragraph has ${fpWords} words (aim for 40 to 70, and it must answer the title)`);

  for (const e of errors) console.log(`ERROR ${name}: ${e}`);
  for (const w of warns) console.log(`WARN  ${name}: ${w}`);
  if (!errors.length && !warns.length) console.log(`OK    ${name} (${words} words)`);
  return errors.length ? 1 : 0;
}

const args = process.argv.slice(2);
const files = args.length ? args.map((f) => path.resolve(f)) : allFiles.map((f) => path.join(postsDir, f));
let failed = 0;
for (const f of files) failed |= lint(f);
console.log(`\n${files.length} post(s) checked${failed ? ", with errors" : ", no errors"}.`);
process.exit(failed);
