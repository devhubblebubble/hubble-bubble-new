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
const today = new Date().toISOString().slice(0, 10);
const query =
  '*[_type == "jobRole" && status == "open" && defined(slug.current) && (!defined(closingDate) || closingDate >= $today)]{title, "slug": slug.current, _updatedAt} | order(_updatedAt desc)';
const sanityRes = await fetch(`${SANITY}?query=${encodeURIComponent(query)}&$today=${encodeURIComponent(JSON.stringify(today))}`);
const roles = (await sanityRes.json()).result ?? [];
say(`Sanity: ${roles.length} open roles, newest edit ${roles[0]?._updatedAt ?? "none"} (${roles[0]?.title ?? "-"})`);

const listing = await get("/recruitment/");
const listingText = visibleText(listing.body);
const missing = roles.filter((r) => !listingText.includes(r.title)).map((r) => r.title);
if (missing.length) fail(`titles in Sanity but not on /recruitment/: ${missing.join(" | ")}`);
else say(`/recruitment/ shows all ${roles.length} titles from Sanity`);

// ── 3. Every page ───────────────────────────────────────────────────────────
const slugs = [...new Set([...listing.body.matchAll(/href="\/recruitment\/([a-z0-9-]+)\/"/g)].map((m) => m[1]))];
const pages = ["/", "/recruitment/", "/about/", "/services/", "/stories/", "/privacy/", "/contact/", ...slugs.map((s) => `/recruitment/${s}/`)];

for (const path of pages) {
  const { status, body } = await get(path);
  const title = decode(first(/<title[^>]*>([^<]*)<\/title>/, body) ?? "");
  const canonical = first(/<link rel="canonical" href="([^"]*)"/, body) ?? "-";
  const robots = first(/<meta name="robots" content="([^"]*)"/, body) ?? "-";
  const ld = jsonLdTypes(body);
  const images = (body.match(/cdn\.sanity\.io\/images/g) ?? []).length;
  const text = visibleText(body);
  const bad = ["undefined", "[object Object]", "NaN"].filter((w) => text.includes(w));
  const line = `${status} ${path} | ${title} | canonical ${canonical} | robots ${robots} | json-ld ${ld.join(",") || "-"} | sanity images ${images}${bad.length ? ` | BAD TEXT ${bad.join(",")}` : ""}`;
  if (status !== 200 || bad.length) fail(line);
  else say(line);
}

// ── 4. robots.txt, sitemap, and a missing page ──────────────────────────────
const robotsTxt = await get("/robots.txt");
say(`${robotsTxt.status} /robots.txt | ${robotsTxt.body.trim().split("\n").slice(0, 3).join(" / ")}`);
const sitemap = await get("/sitemap.xml");
say(`${sitemap.status} /sitemap.xml | ${(sitemap.body.match(/<loc>/g) ?? []).length} urls`);
const missingPage = await get("/this-page-does-not-exist/");
if (missingPage.status === 404) say("404 for a missing page, as it should be");
else fail(`a missing page returned ${missingPage.status}`);

// ── Report ──────────────────────────────────────────────────────────────────
const escape = (s) => s.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
for (let i = 0; i < report.length; i += 12) {
  console.log(`::notice title=Test site check ${Math.floor(i / 12) + 1}::${escape(report.slice(i, i + 12).join("\n"))}`);
}
process.exitCode = failed ? 1 : 0;
