// Tiny markup used in the seed JSON files, converted to Portable Text (the
// format the Sanity editor stores). Used by the import script and by offline
// test builds.
//
//   **bold**              -> strong
//   [em]...[/em]          -> em
//   [mint]...[/mint]      -> mint highlight (brand mint colour)
//   [orange]...[/orange]  -> orange highlight (brand orange colour)
//   a single newline      -> line break inside the paragraph
//   a blank line          -> new paragraph
//   lines starting "• "   -> bullet list items

const TOKEN = /(\*\*|\[em\]|\[\/em\]|\[mint\]|\[\/mint\]|\[orange\]|\[\/orange\])/;

/** @returns {{_type:'span',_key:string,text:string,marks:string[]}[]} */
function toSpans(text, keyPrefix) {
  const spans = [];
  const active = new Set();
  let i = 0;
  for (const part of text.split(TOKEN)) {
    if (part === "") continue;
    if (part === "**") {
      if (active.has("strong")) active.delete("strong");
      else active.add("strong");
      continue;
    }
    const open = /^\[(em|mint|orange)\]$/.exec(part);
    if (open) {
      active.add(open[1]);
      continue;
    }
    const close = /^\[\/(em|mint|orange)\]$/.exec(part);
    if (close) {
      active.delete(close[1]);
      continue;
    }
    spans.push({
      _type: "span",
      _key: `${keyPrefix}s${(i += 1)}`,
      text: part,
      marks: [...active],
    });
  }
  return spans;
}

/**
 * Convert marked-up text to Portable Text blocks.
 * @param {string} text
 * @param {string} [keyPrefix] unique prefix for block keys
 */
export function toBlocks(text, keyPrefix = "b") {
  if (!text) return [];
  const paragraphs = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const blocks = [];
  let n = 0;
  for (const para of paragraphs) {
    const lines = para.split("\n");
    const isList = lines.every((l) => l.trim().startsWith("• "));
    if (isList) {
      for (const line of lines) {
        n += 1;
        blocks.push({
          _type: "block",
          _key: `${keyPrefix}${n}`,
          style: "normal",
          listItem: "bullet",
          level: 1,
          markDefs: [],
          children: toSpans(line.trim().slice(2), `${keyPrefix}${n}`),
        });
      }
    } else {
      n += 1;
      blocks.push({
        _type: "block",
        _key: `${keyPrefix}${n}`,
        style: "normal",
        markDefs: [],
        children: toSpans(para, `${keyPrefix}${n}`),
      });
    }
  }
  return blocks;
}

/** Keys in seed JSON ending with these suffixes hold marked-up text. */
export const TEXT_FIELD_SUFFIXES = ["Rich", "Styled"];

/**
 * Walk a seed document and convert every field whose name ends in "Rich" or
 * "Styled" from markup to Portable Text. Returns a new object.
 */
export function convertMarkupFields(value, path = "r") {
  if (Array.isArray(value)) {
    return value.map((v, i) => convertMarkupFields(v, `${path}${i}`));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === "string" && TEXT_FIELD_SUFFIXES.some((s) => k.endsWith(s))) {
        out[k] = toBlocks(v, `${path}${k}`);
      } else {
        out[k] = convertMarkupFields(v, `${path}${k}`);
      }
    }
    return out;
  }
  return value;
}
