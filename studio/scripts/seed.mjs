// One-off import of the starting content into Sanity.
//
// Reads content/seed/*.json (at the repo root) and creates each document in the
// dataset, skipping any document that already exists so re-running never
// overwrites edits made in the Studio.
//
// Needs SANITY_WRITE_TOKEN in the environment (a token with Editor rights).
// Run from the studio folder: npm run seed

import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

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

const seedDir = new URL("../../content/seed/", import.meta.url);
const readJson = async (file) =>
  JSON.parse(await readFile(new URL(file, seedDir), "utf8"));

// Plain paragraphs -> Portable Text blocks (the Studio's rich text format).
const toBlocks = (paragraphs = []) =>
  paragraphs.map((text, i) => ({
    _type: "block",
    _key: `p${i + 1}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i + 1}`, text, marks: [] }],
  }));

// Sanity does not store null or undefined values, so drop them.
const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  );

const roles = (await readJson("job-roles.json")).map((r) =>
  clean({
    ...r,
    slug: { _type: "slug", current: r.slug },
    about: toBlocks(r.about),
  }),
);
const settings = clean(await readJson("site-settings.json"));

const tx = client.transaction();
for (const doc of [...roles, settings]) tx.createIfNotExists(doc);

const result = await tx.commit({ returnDocuments: false });

let created = 0;
let skipped = 0;
for (const r of result.results ?? []) {
  if (r.operation === "create") created += 1;
  else skipped += 1;
}
console.log(
  `Done. Created ${created} document(s), left ${skipped} existing document(s) untouched.`,
);
