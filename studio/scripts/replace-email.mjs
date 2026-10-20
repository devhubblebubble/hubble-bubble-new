// One-off: swaps the old contact email for the new one in every Sanity
// document, drafts included. Only the exact address below is replaced, so
// anything else that merely contains "hubblebubble.uk" (an Instagram link, for
// example) is left alone. It also lists any other Hubble Bubble email address
// it meets, without changing them.
//
// Needs SANITY_WRITE_TOKEN in the environment (a token with Editor rights).
// Run from the studio folder: node scripts/replace-email.mjs

import { createClient } from "@sanity/client";

const OLD = "hello@hubblebubble.uk";
const NEW = "hello@hubblebubble.club";
const ANY_HUBBLE_EMAIL = /[A-Za-z0-9._%+-]+@hubblebubble\.[a-z]+/g;

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
  perspective: "raw", // published documents and drafts
});

/** The value with OLD swapped for NEW, and how many swaps that took. */
function swap(value) {
  if (typeof value === "string") {
    const parts = value.split(OLD);
    return [parts.join(NEW), parts.length - 1];
  }
  if (Array.isArray(value)) {
    let count = 0;
    const next = value.map((item) => {
      const [swapped, n] = swap(item);
      count += n;
      return swapped;
    });
    return [next, count];
  }
  if (value && typeof value === "object") {
    let count = 0;
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      const [swapped, n] = swap(item);
      count += n;
      next[key] = swapped;
    }
    return [next, count];
  }
  return [value, 0];
}

/** Adds every Hubble Bubble email address found in the strings of a value. */
function collectEmails(value, found) {
  if (typeof value === "string") {
    for (const match of value.matchAll(ANY_HUBBLE_EMAIL)) found.add(match[0]);
  } else if (Array.isArray(value)) {
    for (const item of value) collectEmails(item, found);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectEmails(item, found);
  }
}

const docs = await client.fetch('*[!(_type match "sanity.*") && !(_type match "system.*")]');
console.log(`Looked at ${docs.length} documents (drafts included).`);

let swapped = 0;
let failed = 0;
const otherAddresses = new Map(); // address -> where it was seen

for (const doc of docs) {
  const set = {};
  let count = 0;

  for (const [field, value] of Object.entries(doc)) {
    if (field.startsWith("_")) continue;

    const [next, n] = swap(value);
    if (n > 0) {
      set[field] = next;
      count += n;
    }

    const found = new Set();
    collectEmails(value, found);
    for (const address of found) {
      if (address === OLD || address === NEW) continue;
      otherAddresses.set(address, `${doc._id}.${field}`);
    }
  }

  if (count === 0) continue;

  try {
    // ifRevisionId: if someone saved a change a moment ago, do not overwrite it
    await client.patch(doc._id).ifRevisionId(doc._rev).set(set).commit();
    swapped += count;
    console.log(`Changed ${count} in ${doc._id} (${doc._type}): ${Object.keys(set).join(", ")}`);
  } catch (error) {
    failed += 1;
    console.log(`FAILED ${doc._id} (${doc._type}): ${error.message}`);
  }
}

console.log(`Swapped ${OLD} for ${NEW} in ${swapped} place(s).`);
if (otherAddresses.size > 0) {
  console.log(
    "Other Hubble Bubble addresses (not changed): " +
      [...otherAddresses].map(([address, where]) => `${address} in ${where}`).join("; "),
  );
} else {
  console.log("No other Hubble Bubble email addresses found in the content.");
}
if (failed > 0) process.exitCode = 1;
