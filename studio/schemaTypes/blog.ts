import { defineArrayMember, defineField, defineType, type Rule } from "sanity";
import { seoFields, str, text } from "./helpers";

// The blog: topics (the six sections on /blog/) and posts.
// Starting posts come from content/blog/*.md and are imported once; after
// that, everything is edited here.

const COUNTRY_OPTIONS = [
  { title: "United Kingdom", value: "GB" },
  { title: "Ireland", value: "IE" },
  { title: "Germany", value: "DE" },
  { title: "Netherlands", value: "NL" },
  { title: "France", value: "FR" },
  { title: "Rest of Europe", value: "EU" },
  { title: "Australia", value: "AU" },
  { title: "New Zealand", value: "NZ" },
  { title: "Canada", value: "CA" },
  { title: "United States", value: "US" },
  { title: "South Korea", value: "KR" },
  { title: "Japan", value: "JP" },
  { title: "United Arab Emirates", value: "AE" },
  { title: "Singapore", value: "SG" },
  { title: "Malaysia", value: "MY" },
];

// A simple table in a post: rows of plain text cells.
export const blogTable = defineType({
  name: "table",
  title: "Table",
  type: "object",
  fields: [
    defineField({
      name: "rows",
      title: "Rows",
      type: "array",
      description:
        "The first row is the header. Give every row the same number of cells. A cell can use **bold** or [link text](https://...).",
      of: [
        defineArrayMember({
          type: "object",
          name: "tableRow",
          title: "Row",
          fields: [
            defineField({
              name: "cells",
              title: "Cells",
              type: "array",
              of: [{ type: "string" }],
            }),
          ],
          preview: {
            select: { cells: "cells" },
            prepare: ({ cells }: { cells?: string[] }) => ({ title: (cells ?? []).join("  |  ") || "Empty row" }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { rows: "rows" },
    prepare: ({ rows }: { rows?: { cells?: string[] }[] }) => ({
      title: `Table: ${(rows?.[0]?.cells ?? []).join(", ") || "no header yet"}`,
      subtitle: `${Math.max((rows?.length ?? 0) - 1, 0)} rows under the header`,
    }),
  },
});

export const blogTopic = defineType({
  name: "blogTopic",
  title: "Blog topic",
  type: "document",
  fields: [
    str("title", "Topic name", 'e.g. "Visas and work rights". Shown as the heading on the blog page and the topic page.', {
      validation: (rule: Rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      description: "The topic page address, e.g. visas gives /blog/topics/visas/. Changing it later breaks links people already have.",
      options: { source: "title", maxLength: 40 },
      validation: (rule) => rule.required(),
    }),
    text("description", "Short description", "One sentence. Shown under the topic name and in Google results for the topic page."),
    text("intro", "Longer introduction (optional)", "A short paragraph shown on the topic page only."),
    defineField({
      name: "order",
      title: "Order on the blog page",
      type: "number",
      description: "Lower numbers first.",
    }),
    ...seoFields(),
  ],
  orderings: [{ title: "Order on the blog page", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "description" } },
});

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "extras", title: "Questions and sources" },
    { name: "people", title: "People and dates" },
    { name: "seo", title: "Search" },
  ],
  fields: [
    // ── Content ──────────────────────────────────────────────────────────
    str("title", "Title", "The question or phrase a student would search for. Aim for 65 characters or fewer.", {
      group: "content",
      validation: (rule: Rule) => rule.required().max(90).warning(),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      group: "content",
      description: "The post address, e.g. uk-student-visa-guide gives /blog/uk-student-visa-guide/. Click Generate after typing the title. Changing it later breaks links people already have.",
      options: { source: "title", maxLength: 80 },
      // "topics" is taken by the topic pages (/blog/topics/...).
      validation: (rule) =>
        rule.required().custom((value) =>
          value?.current === "topics" ? 'The address "topics" is taken by the topic pages. Pick another.' : true,
        ),
    }),
    defineField({
      name: "topic",
      title: "Topic",
      type: "reference",
      to: [{ type: "blogTopic" }],
      group: "content",
      weak: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "pillar",
      title: "Main guide for its topic",
      type: "boolean",
      group: "content",
      description: "Main guides are shown first and highlighted on the topic page. Usually one per topic.",
      initialValue: false,
    }),
    text("excerpt", "Card text", "One or two sentences shown on the post's card. 200 characters or fewer.", {
      group: "content",
      validation: (rule: Rule) => rule.max(220).warning(),
    }),
    defineField({
      name: "keyPoints",
      title: "In short (key points)",
      type: "array",
      group: "content",
      description: "Three to five short facts, one line each, shown in a box at the top of the post.",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "body",
      title: "Post text",
      type: "array",
      group: "content",
      description:
        "Start with a paragraph that answers the title. Use Heading for sections (worded as the questions people ask) and Small heading inside a section. Insert a table from the + button.",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Paragraph", value: "normal" },
            { title: "Heading", value: "h2" },
            { title: "Small heading", value: "h3" },
          ],
          lists: [
            { title: "Bullet list", value: "bullet" },
            { title: "Numbered list", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "Web address",
                    description: "A full address (https://...) or a page on this site (/blog/uk-student-visa-guide/).",
                    validation: (rule: Rule) =>
                      rule.uri({ scheme: ["http", "https", "mailto", "tel"], allowRelative: true }),
                  },
                ],
              },
            ],
          },
        }),
        defineArrayMember({ type: "table" }),
      ],
    }),

    // ── Questions and sources ────────────────────────────────────────────
    defineField({
      name: "faq",
      title: "Questions people ask",
      type: "array",
      group: "extras",
      description: "Three to five questions, each with a two to four sentence answer that makes sense on its own.",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqItem",
          title: "Question",
          fields: [
            str("question", "Question", undefined, { validation: (rule: Rule) => rule.required() }),
            text("answer", "Answer", undefined, { validation: (rule: Rule) => rule.required() }),
          ],
          preview: { select: { title: "question", subtitle: "answer" } },
        }),
      ],
    }),
    defineField({
      name: "sources",
      title: "Sources",
      type: "array",
      group: "extras",
      description: "Every official page a fact in this post comes from. Shown as a numbered list at the end.",
      of: [
        defineArrayMember({
          type: "object",
          name: "sourceLink",
          title: "Source",
          fields: [
            str("title", "Page title", undefined, { validation: (rule: Rule) => rule.required() }),
            defineField({
              name: "url",
              title: "Web address",
              type: "url",
              validation: (rule) => rule.required().uri({ scheme: ["http", "https"] }),
            }),
          ],
          preview: { select: { title: "title", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "related",
      title: "Read next",
      type: "array",
      group: "extras",
      description: "Two to four other posts shown at the end.",
      of: [defineArrayMember({ type: "reference", to: [{ type: "post" }], weak: true })],
      validation: (rule) => rule.unique(),
    }),

    // ── People and dates ─────────────────────────────────────────────────
    defineField({
      name: "author",
      title: "Written by (optional)",
      type: "reference",
      to: [{ type: "teamMember" }],
      group: "people",
      weak: true,
      description: 'Leave empty and the post shows "By the Hubble Bubble team".',
    }),
    defineField({
      name: "reviewedBy",
      title: "Reviewed by (optional)",
      type: "reference",
      to: [{ type: "teamMember" }],
      group: "people",
      weak: true,
      description: 'Set this once a team member has checked the post. The post then shows "Reviewed by <name>, <job title>".',
    }),
    defineField({
      name: "publishedAt",
      title: "First published",
      type: "date",
      group: "people",
      options: { dateFormat: "D MMMM YYYY" },
    }),
    defineField({
      name: "reviewedAt",
      title: "Last checked",
      type: "date",
      group: "people",
      description: 'The date the facts were last checked against the sources. Shown as "Last checked" on the post. Update it every time you check.',
      options: { dateFormat: "D MMMM YYYY" },
    }),
    defineField({
      name: "hidden",
      title: "Hide from the website",
      type: "boolean",
      group: "people",
      description: "Hidden posts stay saved here but disappear from the blog.",
      initialValue: false,
    }),

    // ── Search ───────────────────────────────────────────────────────────
    str("description", "Search result description", "One plain sentence shown under the title in Google results. 120 to 155 characters.", {
      group: "seo",
      validation: (rule: Rule) => rule.max(160).warning("Keep it under 160 characters so Google shows all of it."),
    }),
    str("seoTitle", "Search result title (optional)", 'Leave empty to use the title followed by "| Hubble Bubble".', {
      group: "seo",
      validation: (rule: Rule) => rule.max(70).warning(),
    }),
    defineField({
      name: "countries",
      title: "Countries this post covers",
      type: "array",
      group: "seo",
      of: [{ type: "string" }],
      options: { list: COUNTRY_OPTIONS },
    }),
  ],
  orderings: [
    { title: "Last checked, newest first", name: "reviewedDesc", by: [{ field: "reviewedAt", direction: "desc" }] },
    { title: "Title", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", topic: "topic.title", pillar: "pillar", hidden: "hidden" },
    prepare: ({ title, topic, pillar, hidden }: { title?: string; topic?: string; pillar?: boolean; hidden?: boolean }) => ({
      title: title || "Untitled post",
      subtitle: [topic, pillar ? "Main guide" : null, hidden ? "Hidden" : null].filter(Boolean).join(" · "),
    }),
  },
});
