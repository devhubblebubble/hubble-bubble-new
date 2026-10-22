// Tests for the Study in and Students from pages. Run: npm run test:blog
import assert from "node:assert/strict";
import test from "node:test";
import {
  byRegion,
  destinationPosts,
  destinationsFor,
  hubLabel,
  isReady,
  originPosts,
  originsFor,
  tidyHubs,
} from "./hubs.mjs";

// Posts in display order (as getPosts returns them).
const posts = [
  { slug: "study-in-the-uk", countries: ["GB"], related: [{ slug: "uk-student-visa-guide" }, null] },
  { slug: "uk-student-visa-guide", countries: ["GB"] },
  { slug: "which-country", countries: ["GB", "IE", "DE"] },
  { slug: "uk-costs", countries: ["GB"] },
  { slug: "study-in-germany", countries: ["DE"] },
  { slug: "study-in-europe", countries: ["EU", "FR"] },
  { slug: "study-abroad-from-nigeria", countries: ["GB", "CA"], origins: ["nigeria"] },
  { slug: "nigeria-documents", countries: ["GB"], origins: ["nigeria", "kenya"] },
  { slug: "study-in-canada", countries: ["CA"] },
];
const slugs = posts.map((p) => p.slug);

const rawDestinations = [
  { slug: "uk", name: "United Kingdom", nameInSentence: "the UK", guideSlug: "study-in-the-uk", isoCodes: ["GB"] },
  { slug: "europe", name: "Europe", guideSlug: "study-in-europe", featuredSlugs: ["study-in-germany", "gone", null], isoCodes: ["DE", "FR", "EU"] },
  { slug: "canada", name: "Canada", guideSlug: "study-in-canada", isoCodes: ["CA"] },
  { slug: "usa", name: "United States", guideSlug: "study-in-the-usa-not-written-yet", isoCodes: ["US"] },
  { slug: "uk", name: "Duplicate address", guideSlug: null, isoCodes: ["GB"] },
];
const rawOrigins = [
  { slug: "nigeria", name: "Nigeria", guideSlug: "study-abroad-from-nigeria", featuredSlugs: ["uk-student-visa-guide"], region: "africa" },
  // Picks a guide a destination already owns: it becomes a listed post here.
  { slug: "kenya", name: "Kenya", guideSlug: "study-in-the-uk", region: "africa" },
  { slug: "india", name: "India", region: "south-asia" },
  { slug: "atlantis", name: "Atlantis", region: "nowhere" },
];

test("tidyHubs drops missing posts and duplicate addresses, and gives each guide one hub", () => {
  const { destinations, origins, guides } = tidyHubs(rawDestinations, rawOrigins, slugs);
  assert.deepEqual(destinations.map((d) => d.slug), ["uk", "europe", "canada", "usa"]);
  assert.deepEqual(destinations[1].featuredSlugs, ["study-in-germany"]);
  assert.equal(destinations[3].guideSlug, null, "a guide that is not on the site is dropped");
  assert.equal(origins[1].guideSlug, null, "Kenya's guide belongs to the UK page");
  assert.deepEqual(origins[1].featuredSlugs, ["study-in-the-uk"]);
  assert.deepEqual([...guides.entries()], [
    ["study-in-the-uk", "/blog/study-in/uk/"],
    ["study-in-europe", "/blog/study-in/europe/"],
    ["study-in-canada", "/blog/study-in/canada/"],
    ["study-abroad-from-nigeria", "/blog/students-from/nigeria/"],
  ]);
  assert.deepEqual(destinations.filter(isReady).map((d) => d.slug), ["uk", "europe", "canada"]);
  assert.deepEqual(tidyHubs().guides.size, 0);
});

test("a Study in page lists picks, the guide's Read next, then posts on its countries", () => {
  const { destinations } = tidyHubs(rawDestinations, rawOrigins, slugs);
  const [uk, europe] = destinations;
  // Not the guide itself; not posts written for particular home countries;
  // posts only about the UK before posts that also cover other countries.
  assert.deepEqual(destinationPosts(uk, posts).map((p) => p.slug), ["uk-student-visa-guide", "uk-costs", "which-country"]);
  assert.deepEqual(destinationPosts(europe, posts).map((p) => p.slug), ["study-in-germany", "which-country"]);
});

test("a Students from page lists picks, then posts written for that country", () => {
  const { origins } = tidyHubs(rawDestinations, rawOrigins, slugs);
  const [nigeria, kenya, india] = origins;
  assert.deepEqual(originPosts(nigeria, posts).map((p) => p.slug), ["uk-student-visa-guide", "nigeria-documents"]);
  assert.deepEqual(originPosts(kenya, posts).map((p) => p.slug), ["study-in-the-uk", "nigeria-documents"]);
  // Posts only for this country come before posts shared with other countries.
  const extra = [...posts, { slug: "kenya-only", origins: ["kenya"] }];
  assert.deepEqual(originPosts(kenya, extra).map((p) => p.slug), ["study-in-the-uk", "kenya-only", "nigeria-documents"]);
  assert.deepEqual(originPosts(india, posts), []);
});

test("hubs link to the ready hubs of the other kind that their guide covers", () => {
  const { destinations, origins } = tidyHubs(rawDestinations, rawOrigins, slugs);
  const [uk, europe, canada] = destinations;
  assert.deepEqual(originsFor(uk, origins, posts).map((o) => o.slug), ["nigeria"]);
  assert.deepEqual(originsFor(canada, origins, posts).map((o) => o.slug), ["nigeria"]);
  assert.deepEqual(originsFor(europe, origins, posts), []);
  // Nigeria's guide covers GB and CA; India has no guide, so it gets every ready destination.
  assert.deepEqual(destinationsFor(origins[0], destinations, posts).map((d) => d.slug), ["uk", "canada"]);
  assert.deepEqual(destinationsFor(origins[2], destinations, posts).map((d) => d.slug), ["uk", "europe", "canada"]);
});

test("home countries are grouped by region, unknown regions last", () => {
  const { origins } = tidyHubs(rawDestinations, rawOrigins, slugs);
  assert.deepEqual(
    byRegion(origins).map((g) => [g.title, g.hubs.map((h) => h.slug)]),
    [
      ["South Asia", ["india"]],
      ["Africa", ["nigeria", "kenya"]],
      ["Other countries", ["atlantis"]],
    ],
  );
});

test("labels read naturally", () => {
  assert.equal(hubLabel("destination", { slug: "uk", name: "United Kingdom", nameInSentence: "the UK" }), "Study in the UK");
  assert.equal(hubLabel("origin", { slug: "kenya", name: "Kenya" }), "Students from Kenya");
});
