// Tests for the blog post converter. Run: npm run test:blog
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { inlineToSpans, markdownToBlocks, parsePostFile, postDocument, readPostDocuments } from "./blog.mjs";

const sample = `---
{
  "title": "Sample post",
  "slug": "sample-post",
  "topic": "visas",
  "pillar": true,
  "description": "A description.",
  "excerpt": "An excerpt.",
  "countries": ["GB"],
  "published": "2026-10-22",
  "reviewed": "2026-10-23",
  "keyPoints": ["One", "Two", "Three"],
  "faq": [{"q": "A question?", "a": "An answer."}],
  "sources": [{"title": "GOV.UK", "url": "https://www.gov.uk/student-visa"}],
  "related": ["other-post"]
}
---
The first paragraph
runs over two lines.

## A heading

- First **bold** item
- Second item with a [link](https://www.gov.uk/student-visa)

1. Step one
2. Step two

### A smaller heading

| Country | Hours |
| --- | --- |
| UK | 20 a week |
| Ireland | 20 \\| 40 |
`;

test("front matter and body are split", () => {
  const { meta, body } = parsePostFile(sample, "sample.md");
  assert.equal(meta.slug, "sample-post");
  assert.match(body, /^The first paragraph/);
});

test("bad front matter is reported with the file name", () => {
  assert.throws(() => parsePostFile("no front matter", "x.md"), /x\.md/);
  assert.throws(() => parsePostFile("---\n{ nope }\n---\nbody", "y.md"), /y\.md: the front matter is not valid JSON/);
});

test("bold and links become marks", () => {
  const { children, markDefs } = inlineToSpans("Read **this** and [the rules](https://a.b/c) now", "k");
  assert.deepEqual(
    children.map((c) => [c.text, c.marks]),
    [["Read ", []], ["this", ["strong"]], [" and ", []], ["the rules", ["kl1"]], [" now", []]],
  );
  assert.deepEqual(markDefs, [{ _type: "link", _key: "kl1", href: "https://a.b/c" }]);
});

test("Markdown blocks: paragraph, headings, lists, table", () => {
  const { body } = parsePostFile(sample);
  const blocks = markdownToBlocks(body, "s");
  const summary = blocks.map((b) => (b._type === "table" ? "table" : `${b.style}${b.listItem ? `:${b.listItem}` : ""}`));
  assert.deepEqual(summary, ["normal", "h2", "normal:bullet", "normal:bullet", "normal:number", "normal:number", "h3", "table"]);
  assert.equal(blocks[0].children[0].text, "The first paragraph runs over two lines.");
  const table = blocks.at(-1);
  assert.deepEqual(table.rows.map((r) => r.cells), [["Country", "Hours"], ["UK", "20 a week"], ["Ireland", "20 | 40"]]);
  assert.equal(table.rows[0]._type, "tableRow");
  // Keys are unique and stable.
  const keys = blocks.map((b) => b._key);
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(markdownToBlocks(body, "s").map((b) => b._key), keys);
});

test("post document has ids, references and keys", () => {
  const { meta, body } = parsePostFile(sample);
  const doc = postDocument(meta, body);
  assert.equal(doc._id, "post-sample-post");
  assert.deepEqual(doc.slug, { _type: "slug", current: "sample-post" });
  assert.deepEqual(doc.topic, { _type: "reference", _ref: "blogTopic-visas" });
  assert.equal(doc.related[0]._ref, "post-other-post");
  assert.equal(doc.faq[0].question, "A question?");
  assert.equal(doc.faq[0]._key, "sample-post-faq1");
  assert.equal(doc.sources[0]._type, "sourceLink");
  assert.equal(doc.reviewedAt, "2026-10-23");
  assert.equal(doc.pillar, true);
});

test("a folder of posts is read in slug order, skipping drafts", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "blog-"));
  try {
    writeFileSync(path.join(dir, "b.md"), sample.replace(/sample-post/g, "b"));
    writeFileSync(path.join(dir, "a.md"), sample.replace(/sample-post/g, "a"));
    writeFileSync(path.join(dir, "_draft.md"), "not read");
    writeFileSync(path.join(dir, "notes.txt"), "not read");
    assert.deepEqual(readPostDocuments(dir).map((d) => d._id), ["post-a", "post-b"]);
    assert.deepEqual(readPostDocuments(path.join(dir, "missing")), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
