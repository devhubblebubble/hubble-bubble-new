// One-off (22 October 2026): four corrections Jevin approved to blog content
// that is already in Sanity. The import never overwrites a document, so the
// post files in content/blog and content/seed/blog-topics.json were corrected
// and this script copies only the changed fields into Sanity:
//   1. uk-student-visa-guide: the lighter evidence rule applies only when you
//      apply from the country where you live or from the UK, and also covers
//      the documents used to get the offer (Appendix Student ST 22.1); plus
//   2. the UK visa brake, in uk-student-visa-guide and
//      which-country-should-you-study-in;
//   3. government-scholarships-for-international-students: Chevening's work
//      experience must come after the undergraduate degree;
//   4. the Study destinations topic description lists the ten destinations.
//
// Safe to re-run. A field is only changed if it is still exactly as the
// import wrote it (from the files at commit IMPORTED_AT); anything edited in
// the Studio since, or a document with unpublished changes, is left alone and
// reported. ifRevisionId stops it overwriting an edit saved a moment earlier.
//
// Needs SANITY_WRITE_TOKEN (a token with Editor rights) and the git history
// (actions/checkout with fetch-depth: 0). Run from the studio folder:
//   node scripts/fix-blog-2026-10-22.mjs
// Delete this script and .github/workflows/fix-blog-2026-10-22.yml once it has run.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@sanity/client";
import { parsePostFile, postDocument } from "../../content/seed/blog.mjs";
import { convertMarkupFields } from "../../content/seed/markup.mjs";

const IMPORTED_AT = "a776319"; // the push whose files the import created these documents from
const POSTS = [
  "uk-student-visa-guide",
  "which-country-should-you-study-in",
  "government-scholarships-for-international-students",
];
const TOPICS = ["destinations"];

const token = process.env.SANITY_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_WRITE_TOKEN is not set. Add it as a GitHub secret.");
  process.exit(1);
}

const client = createClient({
  projectId: "qstbrsll",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2025-02-19",
  token,
  useCdn: false,
  perspective: "raw",
});

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const atImport = (file) => execFileSync("git", ["show", `${IMPORTED_AT}:${file}`], { cwd: repoRoot, encoding: "utf8" });
const now = (file) => readFileSync(path.join(repoRoot, file), "utf8");

// The same preparation as studio/scripts/seed.mjs, so "before" is exactly what
// the import wrote.
const clean = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== ""));
function withKeys(value, prefix = "k") {
  if (Array.isArray(value)) {
    return value.map((v, i) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? { _key: `${prefix}${i + 1}`, ...withKeys(v, `${prefix}${i + 1}`) }
        : withKeys(v, `${prefix}${i + 1}`),
    );
  }
  if (value && typeof value === "object") {
    if (value._type === "reference" && !/^(image|file)-/.test(value._ref ?? "")) {
      return { ...value, _weak: true };
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = withKeys(v, `${prefix}${k.slice(0, 3)}`);
    return out;
  }
  return value;
}
const prepare = (doc) => clean(withKeys(convertMarkupFields(doc)));

const post = (text, name) => {
  const { meta, body } = parsePostFile(text, name);
  return prepare(postDocument(meta, body));
};
const topic = (json, slug) => {
  const t = JSON.parse(json).find((x) => x.slug === slug);
  if (!t) throw new Error(`topic ${slug} not found`);
  return prepare({ ...t, slug: { _type: "slug", current: t.slug } });
};

// Object key order does not matter; array order does.
const sorted = (v) =>
  Array.isArray(v)
    ? v.map(sorted)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])]))
      : v;
const same = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

let failed = 0;

async function fix(before, after) {
  const id = after._id;
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (k) => !k.startsWith("_") && !same(before[k], after[k]),
  );
  if (fields.length === 0) {
    console.log(`${id}: the files did not change, nothing to do`);
    return;
  }
  const [current, draft] = await Promise.all([client.getDocument(id), client.getDocument(`drafts.${id}`)]);
  if (!current) {
    failed += 1;
    console.log(`LEFT ALONE ${id}: not found in Sanity`);
    return;
  }
  if (draft) {
    failed += 1;
    console.log(`LEFT ALONE ${id}: it has unpublished changes in the Studio`);
    return;
  }
  const edited = fields.filter((f) => !same(current[f], before[f]) && !same(current[f], after[f]));
  if (edited.length) {
    failed += 1;
    console.log(`LEFT ALONE ${id}: ${edited.join(", ")} changed in the Studio since the import`);
    return;
  }
  const todo = fields.filter((f) => !same(current[f], after[f]));
  if (todo.length === 0) {
    console.log(`${id}: already corrected`);
    return;
  }
  try {
    await client
      .patch(id)
      .ifRevisionId(current._rev)
      .set(Object.fromEntries(todo.map((f) => [f, after[f]])))
      .commit();
    console.log(`Corrected ${id}: ${todo.join(", ")}`);
  } catch (error) {
    failed += 1;
    console.log(`FAILED ${id}: ${error.message}`);
  }
}

for (const slug of POSTS) {
  const file = `content/blog/${slug}.md`;
  await fix(post(atImport(file), file), post(now(file), file));
}
for (const slug of TOPICS) {
  const file = "content/seed/blog-topics.json";
  await fix(topic(atImport(file), slug), topic(now(file), slug));
}

console.log(failed ? `${failed} document(s) not corrected, see above.` : "All corrections made.");
if (failed) process.exitCode = 1;
