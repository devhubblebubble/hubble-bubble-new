// Small helpers for blog posts: plain text, reading time, dates, heading
// anchors and the **bold** / [link](url) markup allowed in table cells.
import type { PortableTextBlock } from "@portabletext/types";
import type { PostBody, PostTable } from "@/lib/sanity/types";

type BodyItem = PostBody[number];

export const isTable = (item: BodyItem): item is PostTable => item._type === "table";

/** The text of a Portable Text block's spans. */
export function blockText(block: PortableTextBlock): string {
  const children = (block as { children?: { text?: string }[] }).children ?? [];
  return children.map((c) => c.text ?? "").join("");
}

/** Cell markup without the markers: "**a** [b](c)" -> "a b". */
export const stripInline = (s: string) =>
  s.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1");

const countWords = (s: string) => (s.match(/[\p{L}\p{N}£€$%][\p{L}\p{N}'’.,%-]*/gu) ?? []).length;

/** Words in the post text, tables included. */
export function bodyWords(body: PostBody = []): number {
  let words = 0;
  for (const item of body) {
    if (isTable(item)) {
      for (const row of item.rows ?? []) for (const cell of row.cells ?? []) words += countWords(stripInline(cell));
    } else if (item._type === "block") {
      words += countWords(blockText(item as PortableTextBlock));
    }
  }
  return words;
}

/** Minutes to read at 200 words a minute, at least 1. */
export const readingMinutes = (body?: PostBody) => Math.max(1, Math.round(bodyWords(body) / 200));

/** "22 October 2026" from "2026-10-22". */
export function longDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "") || "section";

// Ids the post page uses for its own sections; body headings never take them.
const RESERVED_IDS = ["main", "post-title", "in-short", "on-this-page", "faq", "sources", "book-a-call", "read-next"];

export type HeadingLink = { key: string; id: string; text: string };

/** Each h2 in the body with a unique id (for the "On this page" list and links). */
export function bodyHeadings(body: PostBody = []): HeadingLink[] {
  const used = new Set(RESERVED_IDS);
  const out: HeadingLink[] = [];
  body.forEach((item, index) => {
    if (isTable(item) || item._type !== "block") return;
    const block = item as PortableTextBlock & { style?: string };
    if (block.style !== "h2") return;
    const text = blockText(block).trim();
    if (!text) return;
    const base = slugify(text);
    let id = base;
    for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    used.add(id);
    out.push({ key: block._key ?? String(index), id, text });
  });
  return out;
}

export type InlinePart = { text: string; bold: boolean; href?: string };

/** "**bold** and [a link](https://...)" -> parts to render. */
export function parseInline(source: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let bold = false;
  let buffer = "";
  const flush = () => {
    if (buffer) parts.push({ text: buffer, bold });
    buffer = "";
  };
  for (let i = 0; i < source.length; ) {
    if (source.startsWith("**", i)) {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (source[i] === "[") {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(source.slice(i));
      if (link) {
        flush();
        link[1].split("**").forEach((piece, n) => {
          if (n > 0) bold = !bold;
          if (piece) parts.push({ text: piece, bold, href: link[2] });
        });
        i += link[0].length;
        continue;
      }
    }
    buffer += source[i];
    i += 1;
  }
  flush();
  return parts;
}
