// Tests for the blog's addresses. Run: npm run test:blog
import assert from "node:assert/strict";
import test from "node:test";
import {
  destinationPath,
  guideHubPaths,
  originPath,
  postHref,
  postPath,
  redirectsFile,
  rewriteBlogHref,
  topicPath,
} from "./urls.mjs";

const destinations = [
  { slug: "uk", guideSlug: "study-in-the-uk" },
  { slug: "ireland", guideSlug: "study-in-ireland" },
  { slug: "europe", guideSlug: null },
];
const origins = [
  { slug: "nigeria", guideSlug: "study-abroad-from-nigeria" },
  // Shares a guide with a destination: the destination wins.
  { slug: "uk", guideSlug: "study-in-the-uk" },
  { slug: "kenya" },
];

test("paths", () => {
  assert.equal(postPath("what-is-a-cas"), "/blog/what-is-a-cas/");
  assert.equal(topicPath("visas"), "/blog/topics/visas/");
  assert.equal(destinationPath("new-zealand"), "/blog/study-in/new-zealand/");
  assert.equal(originPath("sri-lanka"), "/blog/students-from/sri-lanka/");
});

test("guides map to their hubs; missing guides are skipped", () => {
  const guides = guideHubPaths(destinations, origins);
  assert.deepEqual([...guides.entries()], [
    ["study-in-the-uk", "/blog/study-in/uk/"],
    ["study-in-ireland", "/blog/study-in/ireland/"],
    ["study-abroad-from-nigeria", "/blog/students-from/nigeria/"],
  ]);
  assert.equal(guideHubPaths().size, 0);
});

test("a post's address is its hub when it is a guide", () => {
  const guides = guideHubPaths(destinations, origins);
  assert.equal(postHref("study-in-ireland", guides), "/blog/study-in/ireland/");
  assert.equal(postHref("what-is-a-cas", guides), "/blog/what-is-a-cas/");
  assert.equal(postHref("what-is-a-cas"), "/blog/what-is-a-cas/");
});

test("links in post text to a guide's old address go to the hub", () => {
  const guides = guideHubPaths(destinations, origins);
  assert.equal(rewriteBlogHref("/blog/study-in-ireland/", guides), "/blog/study-in/ireland/");
  assert.equal(rewriteBlogHref("/blog/study-in-ireland", guides), "/blog/study-in/ireland/");
  assert.equal(rewriteBlogHref("/blog/study-in-ireland/#work", guides), "/blog/study-in/ireland/#work");
  assert.equal(
    rewriteBlogHref("https://hubblebubble.club/blog/study-abroad-from-nigeria/", guides),
    "/blog/students-from/nigeria/",
  );
  // Everything else is left alone.
  for (const href of [
    "/blog/what-is-a-cas/",
    "/blog/topics/visas/",
    "/blog/study-in/uk/",
    "/contact/",
    "https://www.gov.uk/student-visa",
    "",
    undefined,
  ]) {
    assert.equal(rewriteBlogHref(href, guides), href);
  }
  assert.equal(rewriteBlogHref("/blog/study-in-ireland/", new Map()), "/blog/study-in-ireland/");
});

test("the redirects file sends both old addresses of each guide to its hub", () => {
  const file = redirectsFile(guideHubPaths(destinations, origins));
  const rules = file.split("\n").filter((l) => l && !l.startsWith("#"));
  assert.deepEqual(rules, [
    "/blog/study-abroad-from-nigeria/ /blog/students-from/nigeria/ 301",
    "/blog/study-abroad-from-nigeria /blog/students-from/nigeria/ 301",
    "/blog/study-in-ireland/ /blog/study-in/ireland/ 301",
    "/blog/study-in-ireland /blog/study-in/ireland/ 301",
    "/blog/study-in-the-uk/ /blog/study-in/uk/ 301",
    "/blog/study-in-the-uk /blog/study-in/uk/ 301",
    "/blog/study-in/ /blog/#study-in 302",
    "/blog/study-in /blog/#study-in 302",
    "/blog/students-from/ /blog/#students-from 302",
    "/blog/students-from /blog/#students-from 302",
  ]);
  // Within Cloudflare's limits: one rule per line, at most 2,000 static rules.
  assert.ok(rules.every((r) => r.split(" ").length === 3 && r.length < 1000));
  assert.ok(file.endsWith("\n"));
});
