// Blog posts as files: content/blog/<slug>.md, each with JSON front matter
// between two "---" lines and a small Markdown body. This file turns them into
// the Sanity documents the import script writes (studio/scripts/seed.mjs) and
// the offline test build reads (src/lib/sanity/fixture.ts). No dependencies.
//
// Markdown that is understood:
//   ## Heading            -> h2          ### Heading  -> h3
//   - item / * item       -> bullet list 1. item      -> numbered list
//   **bold**              -> strong      [text](url)  -> link
//   | a | b | + |---|---| -> table (first row is the header)
//   blank line            -> new paragraph (single line breaks are joined)

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const TOPIC_ID_PREFIX = "blogTopic-";
export const POST_ID_PREFIX = "post-";

/**
 * Split a post file into its front matter (parsed JSON) and Markdown body.
 * @param {string} text
 * @param {string} [fileName] for error messages
 * @returns {{ meta: Record<string, any>, body: string }}
 */
export function parsePostFile(text, fileName = "post") {
  const normalised = text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalised);
  if (!match) throw new Error(`${fileName}: the file must start with "---", JSON front matter, then "---"`);
  let meta;
  try {
    meta = JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`${fileName}: the front matter is not valid JSON (${error.message})`);
  }
  return { meta, body: match[2] };
}

/**
 * **bold** and [text](url) -> Portable Text spans and link mark definitions.
 * @param {string} text
 * @param {string} keyBase unique prefix for the keys
 */
export function inlineToSpans(text, keyBase) {
  /** @type {{_type:'span',_key:string,text:string,marks:string[]}[]} */
  const children = [];
  /** @type {{_type:'link',_key:string,href:string}[]} */
  const markDefs = [];
  let strong = false;
  let buffer = "";
  let spanCount = 0;

  const push = (value, extraMarks = []) => {
    if (!value) return;
    spanCount += 1;
    children.push({
      _type: "span",
      _key: `${keyBase}s${spanCount}`,
      text: value,
      marks: [...(strong ? ["strong"] : []), ...extraMarks],
    });
  };
  const flush = () => {
    push(buffer);
    buffer = "";
  };

  let i = 0;
  while (i < text.length) {
    if (text.startsWith("**", i)) {
      flush();
      strong = !strong;
      i += 2;
      continue;
    }
    if (text[i] === "[") {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(text.slice(i));
      if (link) {
        flush();
        const key = `${keyBase}l${markDefs.length + 1}`;
        markDefs.push({ _type: "link", _key: key, href: link[2] });
        link[1].split("**").forEach((part, index) => {
          if (index > 0) strong = !strong;
          push(part, [key]);
        });
        i += link[0].length;
        continue;
      }
    }
    buffer += text[i];
    i += 1;
  }
  flush();
  if (children.length === 0) children.push({ _type: "span", _key: `${keyBase}s1`, text: "", marks: [] });
  return { children, markDefs };
}

const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
const isTableDivider = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

/** "| a | b |" -> ["a", "b"] (a "\|" inside a cell stays a pipe). */
function tableCells(line) {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return inner
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replace(/\\\|/g, "|").trim());
}

/**
 * The Markdown body -> Portable Text blocks (plus custom "table" blocks).
 * @param {string} markdown
 * @param {string} [keyPrefix] unique prefix for block keys, e.g. the slug
 */
export function markdownToBlocks(markdown, keyPrefix = "b") {
  const lines = (markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let n = 0;
  const nextKey = () => `${keyPrefix}-${(n += 1)}`;

  const textBlock = (text, style = "normal", listItem) => {
    const key = nextKey();
    const { children, markDefs } = inlineToSpans(text.trim(), key);
    blocks.push({
      _type: "block",
      _key: key,
      style,
      ...(listItem ? { listItem, level: 1 } : {}),
      markDefs,
      children,
    });
  };

  let paragraph = [];
  const endParagraph = () => {
    if (paragraph.length) textBlock(paragraph.join(" "));
    paragraph = [];
  };

  let item = null; // { text, kind }
  const endItem = () => {
    if (item) textBlock(item.text, "normal", item.kind);
    item = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      endParagraph();
      endItem();
      continue;
    }

    // Table: a row line followed by a divider line.
    if (isTableRow(line) && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      endParagraph();
      endItem();
      const rows = [tableCells(line)];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(tableCells(lines[i]));
        i += 1;
      }
      i -= 1;
      const width = Math.max(...rows.map((r) => r.length));
      const key = nextKey();
      blocks.push({
        _type: "table",
        _key: key,
        rows: rows.map((cells, r) => ({
          _type: "tableRow",
          _key: `${key}r${r + 1}`,
          cells: [...cells, ...Array(width - cells.length).fill("")],
        })),
      });
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      endParagraph();
      endItem();
      textBlock(heading[2], heading[1].length === 2 ? "h2" : "h3");
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (bullet || numbered) {
      endParagraph();
      endItem();
      item = { text: (bullet ?? numbered)[1], kind: bullet ? "bullet" : "number" };
      continue;
    }

    // A line under a list item (indented or not) continues that item.
    if (item) {
      item.text += ` ${trimmed}`;
      continue;
    }
    paragraph.push(trimmed);
  }
  endParagraph();
  endItem();
  return blocks;
}

/**
 * The Sanity document for one post file.
 * @param {Record<string, any>} meta front matter
 * @param {string} body Markdown body
 */
export function postDocument(meta, body) {
  const slug = String(meta.slug ?? "").trim();
  if (!slug) throw new Error(`a post has no slug: "${meta.title ?? "untitled"}"`);
  const doc = {
    _id: POST_ID_PREFIX + slug,
    _type: "post",
    title: meta.title,
    slug: { _type: "slug", current: slug },
    ...(meta.topic ? { topic: { _type: "reference", _ref: TOPIC_ID_PREFIX + meta.topic } } : {}),
    pillar: Boolean(meta.pillar),
    excerpt: meta.excerpt,
    description: meta.description,
    countries: Array.isArray(meta.countries) ? meta.countries : [],
    keyPoints: Array.isArray(meta.keyPoints) ? meta.keyPoints : [],
    body: markdownToBlocks(body, slug),
    faq: (meta.faq ?? []).map((f, i) => ({
      _type: "faqItem",
      _key: `${slug}-faq${i + 1}`,
      question: f.q ?? f.question,
      answer: f.a ?? f.answer,
    })),
    sources: (meta.sources ?? []).map((s, i) => ({
      _type: "sourceLink",
      _key: `${slug}-src${i + 1}`,
      title: s.title,
      url: s.url,
    })),
    related: (meta.related ?? []).map((r, i) => ({
      _type: "reference",
      _key: `${slug}-rel${i + 1}`,
      _ref: POST_ID_PREFIX + r,
    })),
    publishedAt: meta.published,
    reviewedAt: meta.reviewed ?? meta.published,
    ...(meta.seoTitle ? { seoTitle: meta.seoTitle } : {}),
  };
  return doc;
}

/**
 * Every post file in a folder, as Sanity documents, sorted by slug.
 * Files whose names start with "_" or "." are skipped. A missing folder gives [].
 * @param {string} dir
 */
export function readPostDocuments(dir) {
  if (!dir || !existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md") && !name.startsWith("_") && !name.startsWith("."))
    .sort()
    .map((name) => {
      const { meta, body } = parsePostFile(readFileSync(path.join(dir, name), "utf8"), name);
      return postDocument(meta, body);
    });
}

/** The posts folder: BLOG_SEED_DIR if set, else content/blog under the repo root. */
export const postsDir = (repoRoot) =>
  process.env.BLOG_SEED_DIR?.trim() || path.join(repoRoot, "content", "blog");
