import { defineField } from "sanity";

/** Image with alt text, cropping enabled. */
export const imageField = (
  name: string,
  title: string,
  description?: string,
  extra: Record<string, unknown> = {},
) =>
  defineField({
    name,
    title,
    type: "image",
    description,
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "Description for screen readers and search engines",
        type: "string",
      }),
    ],
    ...extra,
  });

/** Plain single-line text. */
export const str = (
  name: string,
  title: string,
  description?: string,
  extra: Record<string, unknown> = {},
) => defineField({ name, title, type: "string", description, ...extra });

/** Plain multi-line text (line breaks kept). */
export const text = (
  name: string,
  title: string,
  description?: string,
  extra: Record<string, unknown> = {},
) => defineField({ name, title, type: "text", rows: 3, description, ...extra });

/** Heading or short line with highlights. Field names end in "Styled". */
export const styled = (
  name: string,
  title: string,
  description?: string,
  extra: Record<string, unknown> = {},
) => defineField({ name, title, type: "styledText", description, ...extra });

/** Paragraph text with highlights, lists and links. Field names end in "Rich". */
export const rich = (
  name: string,
  title: string,
  description?: string,
  extra: Record<string, unknown> = {},
) => defineField({ name, title, type: "richText", description, ...extra });

/** Search engine title and description for a page. */
export const seoFields = (group?: string) => [
  defineField({
    name: "seoTitle",
    title: "Search result title",
    type: "string",
    description: "Shown as the tab title and in Google results. Keep under 60 characters.",
    validation: (rule) => rule.max(70),
    ...(group ? { group } : {}),
  }),
  defineField({
    name: "seoDescription",
    title: "Search result description",
    type: "text",
    rows: 2,
    description: "One or two sentences shown under the title in Google results. Keep under 160 characters.",
    validation: (rule) => rule.max(170),
    ...(group ? { group } : {}),
  }),
];
