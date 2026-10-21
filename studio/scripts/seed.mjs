// One-off import of the starting content into Sanity.
//
// Reads content/seed/*.json and the blog posts in content/blog/*.md (at the
// repo root), uploads any images they point at ({"_upload": "public/images/..."}),
// and writes the documents:
//   - collections (job roles, stories, team members, universities, blog topics,
//     blog posts): created only if missing
//   - single pages and site settings: created if missing; if they already
//     exist, only fields that are still empty get the seed value
// So re-running never overwrites edits made in the Studio.
//
// Needs SANITY_WRITE_TOKEN in the environment (a token with Editor rights).
// Run from the studio folder: npm run seed

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import { postsDir, readPostDocuments } from "../../content/seed/blog.mjs";
import { convertMarkupFields } from "../../content/seed/markup.mjs";

const PROJECT_ID = "qstbrsll";
const DATASET = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!token) {
  console.error("SANITY_WRITE_TOKEN is not set. Add it as a GitHub secret.");
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2025-02-19",
  token,
  useCdn: false,
});

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const seedDir = path.join(repoRoot, "content", "seed");
const readJson = async (file) =>
  JSON.parse(await readFile(path.join(seedDir, file), "utf8"));

// Plain paragraphs -> Portable Text blocks (used by job roles' "about").
const toBlocks = (paragraphs = []) =>
  paragraphs.map((text, i) => ({
    _type: "block",
    _key: `p${i + 1}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i + 1}`, text, marks: [] }],
  }));

// Sanity does not store null or undefined values, so drop them, and drop empty
// strings too so an unfilled field is simply absent.
const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== null && v !== undefined && v !== "",
    ),
  );

// Upload each referenced image once and replace {_upload} with an image field.
const assetCache = new Map();
async function uploadImages(value, keyPath = "") {
  if (Array.isArray(value)) {
    return Promise.all(value.map((v, i) => uploadImages(v, `${keyPath}[${i}]`)));
  }
  if (value && typeof value === "object") {
    if (typeof value._upload === "string") {
      const rel = value._upload;
      let assetId = assetCache.get(rel);
      if (!assetId) {
        const buffer = await readFile(path.join(repoRoot, rel));
        const asset = await client.assets.upload("image", buffer, {
          filename: path.basename(rel),
        });
        assetId = asset._id;
        assetCache.set(rel, assetId);
        console.log(`uploaded ${rel} -> ${assetId}`);
      }
      const rest = Object.fromEntries(Object.entries(value).filter(([k]) => k !== "_upload"));
      return { _type: "image", asset: { _type: "reference", _ref: assetId }, ...rest };
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = await uploadImages(v, `${keyPath}.${k}`);
    return out;
  }
  return value;
}

// Every object inside an array needs a unique _key for the Studio.
function withKeys(value, prefix = "k") {
  if (Array.isArray(value)) {
    return value.map((v, i) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? { _key: `${prefix}${i + 1}`, ...withKeys(v, `${prefix}${i + 1}`) }
        : withKeys(v, `${prefix}${i + 1}`),
    );
  }
  if (value && typeof value === "object") {
    // Weak references: the site ignores a missing target instead of the
    // Studio blocking deletion of a story or team member that is still picked.
    if (value._type === "reference" && !/^(image|file)-/.test(value._ref ?? "")) {
      return { ...value, _weak: true };
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = withKeys(v, `${prefix}${k.slice(0, 3)}`);
    }
    return out;
  }
  return value;
}

const prepare = async (doc) => clean(withKeys(await uploadImages(convertMarkupFields(doc))));

// What to import. SEED_ONLY=blog (the default for pushes, see the workflow)
// writes only blog topics and posts. SEED_ONLY=all also writes the pages,
// settings and the other collections. Pages and collections were imported
// long ago and are edited in the Studio now; re-running them would bring back
// any placeholder document someone deleted there (createIfNotExists) and
// refill any field someone emptied on purpose (setIfMissing).
const only = (process.env.SEED_ONLY || "all").trim().toLowerCase();
if (!["all", "blog"].includes(only)) {
  console.error(`SEED_ONLY must be "all" or "blog", not "${only}".`);
  process.exit(1);
}
const pagesToo = only === "all";
console.log(`Importing: ${pagesToo ? "everything" : "the blog only"}`);

// ── Collections ────────────────────────────────────────────────────────
const roles = pagesToo
  ? await Promise.all(
      (await readJson("job-roles.json")).map((r) =>
        prepare({ ...r, slug: { _type: "slug", current: r.slug }, about: toBlocks(r.about) }),
      ),
    )
  : [];
const stories = pagesToo ? await Promise.all((await readJson("stories.json")).map(prepare)) : [];
const team = pagesToo ? await Promise.all((await readJson("team-members.json")).map(prepare)) : [];
const universities = pagesToo ? await Promise.all((await readJson("universities.json")).map(prepare)) : [];
// Blog: topics, then the posts (content/blog/*.md, or BLOG_SEED_DIR).
const blogTopics = await Promise.all(
  (await readJson("blog-topics.json")).map((t) =>
    prepare({ ...t, slug: { _type: "slug", current: t.slug } }),
  ),
);
const blogPosts = await Promise.all(readPostDocuments(postsDir(repoRoot)).map(prepare));
console.log(`blog: ${blogTopics.length} topic(s), ${blogPosts.length} post(s) in the seed`);

// ── Single documents ───────────────────────────────────────────────────
const singletonFiles = [
  "site-settings.json",
  "home-page.json",
  "about-page.json",
  "services-page.json",
  "stories-page.json",
  "privacy-page.json",
  "contact-page.json",
  "recruitment-page.json",
];
const singletons = [];
if (pagesToo) {
  for (const file of singletonFiles) singletons.push(await prepare(await readJson(file)));
}

const tx = client.transaction();
for (const doc of [...roles, ...stories, ...team, ...universities, ...blogTopics, ...blogPosts]) {
  tx.createIfNotExists(doc);
}
for (const doc of singletons) {
  const { _id, _type, ...fields } = doc;
  tx.createIfNotExists({ _id, _type, ...fields });
  tx.patch(_id, (p) => p.setIfMissing(fields));
}

const result = await tx.commit({ returnDocuments: false });

let created = 0;
let skipped = 0;
for (const r of result.results ?? []) {
  if (r.operation === "create") created += 1;
  else if (r.operation === "none") skipped += 1;
}
const summary = `Created ${created} document(s), left ${skipped} existing document(s) untouched (new fields filled in where empty). Uploaded ${assetCache.size} image(s).`;
console.log(`Done. ${summary}`);
if (process.env.GITHUB_ACTIONS) {
  console.log(`::notice title=Sanity import::${summary}`);
}
