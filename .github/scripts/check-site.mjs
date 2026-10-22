// Looks at the deployed test site from GitHub's servers and reports what it
// finds as a notice on the workflow run.
//
// SITE          base URL of the deployed site
// EXPECT        optional text that must appear on /recruitment/
// WAIT_MINUTES  optional: keep checking for EXPECT for up to this long
//
// It also asks Sanity which roles are open and checks that each title is on
// /recruitment/, so a site that is behind the content shows up as a mismatch.

const site = (process.env.SITE ?? "").replace(/\/+$/, "");
if (!site) {
  console.error("SITE is not set");
  process.exit(1);
}
const expect = (process.env.EXPECT ?? "").trim();
const waitMs = Number(process.env.WAIT_MINUTES || 0) * 60_000;

const SANITY = "https://qstbrsll.api.sanity.io/v2025-02-19/data/query/production";

const report = [];
let failed = false;
const say = (line) => {
  console.log(line);
  report.push(line);
};
const fail = (line) => {
  failed = true;
  say(`FAIL ${line}`);
};

async function get(path) {
  const res = await fetch(site + path, { headers: { "cache-control": "no-cache" } });
  return { status: res.status, body: await res.text() };
}

const decode = (s = "") =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const visibleText = (html) =>
  decode(
    html
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );

const first = (re, s) => re.exec(s)?.[1];

function jsonLdTypes(html) {
  const types = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      for (const node of Array.isArray(data) ? data : [data]) types.push(node["@type"] ?? "?");
    } catch {
      types.push("INVALID-JSON");
    }
  }
  return types;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 1. Optionally wait for a piece of text to appear on /recruitment/ ───────
if (expect) {
  const started = Date.now();
  for (;;) {
    const { body } = await get("/recruitment/");
    const secs = Math.round((Date.now() - started) / 1000);
    if (visibleText(body).includes(expect)) {
      say(`FOUND "${expect}" on /recruitment/ after ${secs}s`);
      break;
    }
    if (Date.now() - started >= waitMs) {
      fail(`"${expect}" not on /recruitment/ after ${secs}s`);
      break;
    }
    await sleep(20_000);
  }
}

// ── 2. Which roles does Sanity say are open, and are they on the site? ─────
// Compares each role's title on /recruitment/ with the published title in
// Sanity, exactly. If WAIT_MINUTES is set, keeps trying until they match, so a
// rebuild that is still running is not reported as a failure.
const today = new Date().toISOString().slice(0, 10);
const query =
  '*[_type == "jobRole" && status == "open" && defined(slug.current) && (!defined(closingDate) || closingDate >= $today)]{title, "slug": slug.current, _updatedAt} | order(_updatedAt desc)';

async function sanityRoles() {
  const res = await fetch(`${SANITY}?query=${encodeURIComponent(query)}&$today=${encodeURIComponent(JSON.stringify(today))}`);
  return (await res.json()).result ?? [];
}

function siteTitles(html) {
  const titles = new Map();
  for (const m of html.matchAll(/<a [^>]*href="\/recruitment\/([a-z0-9-]+)\/"[^>]*>([^<]*)<\/a>/g)) {
    const text = decode(m[2]).trim();
    if (text && !titles.has(m[1])) titles.set(m[1], text);
  }
  return titles;
}

const matchStarted = Date.now();
let roles;
let listing;
let mismatches;
for (;;) {
  roles = await sanityRoles();
  listing = await get("/recruitment/");
  const onSite = siteTitles(listing.body);
  mismatches = roles
    .filter((r) => onSite.get(r.slug) !== r.title)
    .map((r) => `${r.slug}: site shows "${onSite.get(r.slug) ?? "nothing"}", Sanity has "${r.title}"`);
  if (!mismatches.length || Date.now() - matchStarted >= waitMs) break;
  await sleep(20_000);
}
const waited = Math.round((Date.now() - matchStarted) / 1000);
say(`Sanity: ${roles.length} open roles, newest edit ${roles[0]?._updatedAt ?? "none"} (${roles[0]?.title ?? "-"})`);
if (mismatches.length) fail(`site is behind Sanity after ${waited}s: ${mismatches.join(" | ")}`);
else say(`/recruitment/ matches Sanity exactly for all ${roles.length} roles (checked for ${waited}s)`);

// ── 3. Every page ───────────────────────────────────────────────────────────
const slugs = [...new Set([...listing.body.matchAll(/href="\/recruitment\/([a-z0-9-]+)\/"/g)].map((m) => m[1]))];
// The blog: every topic page, Study in and Students from page linked from
// /blog/, and every post linked from /blog/ or a topic page (the blog page
// shows the country guides as their country pages, so some posts are only on
// their topic page).
const blogIndex = await get("/blog/");
const linksIn = (html, re) => [...new Set([...html.matchAll(re)].map((m) => m[1]))];
const blogTopics = linksIn(blogIndex.body, /href="\/blog\/topics\/([a-z0-9-]+)\/"/g);
const blogHubs = linksIn(blogIndex.body, /href="\/blog\/((?:study-in|students-from)\/[a-z0-9-]+)\/"/g);
const RESERVED = new Set(["topics", "study-in", "students-from"]);
const topicPages = await Promise.all(blogTopics.map((t) => get(`/blog/topics/${t}/`)));
const blogPosts = [
  ...new Set(
    [blogIndex, ...topicPages].flatMap(({ body }) => linksIn(body, /href="\/blog\/([a-z0-9-]+)\/"/g)),
  ),
].filter((s) => !RESERVED.has(s));
say(
  `/blog/ links to ${blogTopics.length} topic page(s) and ${blogHubs.length} country page(s); with the topic pages, ${blogPosts.length} post(s)`,
);
const pages = [
  "/", "/recruitment/", "/about/", "/services/", "/journey/", "/gallery/", "/stories/", "/blog/", "/privacy/", "/contact/",
  ...slugs.map((s) => `/recruitment/${s}/`),
  ...blogTopics.map((s) => `/blog/topics/${s}/`),
  ...blogHubs.map((s) => `/blog/${s}/`),
  ...blogPosts.map((s) => `/blog/${s}/`),
];

// Every Hubble Bubble email address found in the pages, and which pages show it
const emailPages = new Map();

for (const path of pages) {
  const { status, body } = await get(path);
  for (const m of body.matchAll(/[A-Za-z0-9._%+-]+@hubblebubble\.[a-z]+/g)) {
    emailPages.set(m[0], (emailPages.get(m[0]) ?? new Set()).add(path));
  }
  const title = decode(first(/<title[^>]*>([^<]*)<\/title>/, body) ?? "");
  const canonical = first(/<link rel="canonical" href="([^"]*)"/, body) ?? "-";
  const robots = first(/<meta name="robots" content="([^"]*)"/, body) ?? "-";
  const ld = jsonLdTypes(body);
  const images = (body.match(/cdn\.sanity\.io\/images/g) ?? []).length;
  const text = visibleText(body);
  const bad = ["undefined", "[object Object]", "NaN"].filter((w) => text.includes(w));
  // Every page needs exactly one heading in the plain HTML. If the page text is
  // only built in the browser, Google and AI tools see no heading at all.
  const h1s = (body.match(/<h1[\s>]/g) ?? []).length;
  const line = `${status} ${path} | ${title} | canonical ${canonical} | robots ${robots} | json-ld ${ld.join(",") || "-"} | h1 ${h1s} | sanity images ${images}${bad.length ? ` | BAD TEXT ${bad.join(",")}` : ""}`;
  if (status !== 200 || bad.length || h1s !== 1) fail(line);
  else say(line);
}

// The email address saved in Site settings is the one the whole site should
// show. Any other Hubble Bubble address (an old one left in some text) fails.
const settingsRes = await fetch(`${SANITY}?query=${encodeURIComponent('*[_type == "siteSettings"][0].contactEmail')}`);
const settingsEmail = String((await settingsRes.json()).result ?? "").trim();
say(
  `Hubble Bubble email addresses on the site: ${
    [...emailPages].map(([address, where]) => `${address} (${where.size} page${where.size === 1 ? "" : "s"})`).join(", ") || "none"
  } | Site settings has ${settingsEmail || "nothing"}`,
);
const otherEmails = [...emailPages.keys()].filter((address) => address.toLowerCase() !== settingsEmail.toLowerCase());
if (settingsEmail && otherEmails.length) {
  fail(`email addresses that are not the Site settings one (${settingsEmail}): ${otherEmails.map((a) => `${a} on ${[...emailPages.get(a)].join(" ")}`).join(" | ")}`);
}

// ── 3b. Old addresses of the country pages' main guides ────────────────────
// A post that is the main guide of a Study in or Students from page lives at
// that page's address; its own /blog/<post>/ address must redirect there (301),
// through the _redirects file made at build time.
const hubQuery =
  '*[_type in ["blogDestination", "blogOrigin"] && defined(slug.current) && defined(guide->slug.current) && guide->hidden != true]{_type, "slug": slug.current, "guide": guide->slug.current}';
const hubRes = await fetch(`${SANITY}?query=${encodeURIComponent(hubQuery)}`);
const hubGuides = (await hubRes.json()).result ?? [];
const hubPath = (h) => `/blog/${h._type === "blogDestination" ? "study-in" : "students-from"}/${h.slug}/`;
const guideTargets = new Map();
for (const h of hubGuides) guideTargets.set(h.guide, [...(guideTargets.get(h.guide) ?? []), hubPath(h)]);
let redirectsOk = 0;
for (const [guide, hubs] of guideTargets) {
  const res = await fetch(`${site}/blog/${guide}/`, { redirect: "manual", headers: { "cache-control": "no-cache" } });
  const location = (res.headers.get("location") ?? "").replace(site, "");
  if (res.status === 301 && hubs.includes(location)) redirectsOk += 1;
  else fail(`/blog/${guide}/ should redirect (301) to ${hubs.join(" or ")}, got ${res.status} ${location || "-"}`);
}
say(`${redirectsOk} of ${guideTargets.size} main guides' old addresses redirect to their country page`);

// ── 4. robots.txt, sitemap, and a missing page ──────────────────────────────
const robotsTxt = await get("/robots.txt");
say(`${robotsTxt.status} /robots.txt | ${robotsTxt.body.trim().split("\n").slice(0, 3).join(" / ")}`);
const sitemap = await get("/sitemap.xml");
say(`${sitemap.status} /sitemap.xml | ${(sitemap.body.match(/<loc>/g) ?? []).length} urls`);
const missingPage = await get("/this-page-does-not-exist/");
if (missingPage.status === 404) say("404 for a missing page, as it should be");
else fail(`a missing page returned ${missingPage.status}`);

// ── 5. The contact form's back end ──────────────────────────────────────────
// Nothing here sends an email: an empty post is refused, and a post with the
// hidden spam-trap field filled in is quietly thrown away.
async function postJson(path, body) {
  const res = await fetch(site + path, {
    method: "POST",
    headers: { "content-type": "application/json", origin: site },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = {};
  }
  return { status: res.status, json, text: text.slice(0, 120) };
}

const emptyPost = await postJson("/api/contact", {});
if (emptyPost.status === 400 && emptyPost.json.error === "too_fast") say("POST /api/contact with nothing in it: refused (400), the form code is live");
else fail(`POST /api/contact with nothing in it returned ${emptyPost.status} ${emptyPost.text}`);

const trapPost = await postJson("/api/contact", { _gotcha: "x" });
if (trapPost.status === 200 && trapPost.json.ok === true) say("POST /api/contact with the spam-trap field filled: quietly dropped, nothing sent");
else fail(`POST /api/contact with the spam trap returned ${trapPost.status} ${trapPost.text}`);

const emptyEligibility = await postJson("/api/eligibility", {});
if (emptyEligibility.status === 400 && emptyEligibility.json.error === "too_fast") say("POST /api/eligibility with nothing in it: refused (400), the eligibility form code is live");
else fail(`POST /api/eligibility with nothing in it returned ${emptyEligibility.status} ${emptyEligibility.text}`);

const getApi = await get("/api/contact");
if (getApi.status === 405) say("GET /api/contact: 405, as it should be");
else fail(`GET /api/contact returned ${getApi.status}`);

const contactPage = await get("/contact/");
const mailto = first(/href="mailto:([^"]+)"/, contactPage.body);
say(`/contact/ shows the email address: ${mailto ?? "NONE"}`);
if (!mailto) fail("no mailto link on /contact/");

// ── Report ──────────────────────────────────────────────────────────────────
const escape = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
for (let i = 0; i < report.length; i += 12) {
  console.log(`::notice title=Test site check ${Math.floor(i / 12) + 1}::${escape(report.slice(i, i + 12).join("\n"))}`);
}
process.exitCode = failed ? 1 : 0;
