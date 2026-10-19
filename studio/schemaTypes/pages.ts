import { defineArrayMember, defineField, defineType, type Rule } from "sanity";
import { imageField, rich, seoFields, str, text } from "./helpers";

const serviceCard = defineArrayMember({
  type: "object",
  name: "serviceCard",
  fields: [str("title", "Title"), text("description", "Description")],
  preview: { select: { title: "title", subtitle: "description" } },
});

export const servicesPage = defineType({
  name: "servicesPage",
  title: "Services page",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "Search" },
  ],
  fields: [
    str("heroEyebrow", "Small line above the title", 'e.g. "Our Services"', { group: "content" }),
    str("heroTitle", "Title", undefined, { group: "content" }),
    text("heroSubtitle", "Intro", undefined, { group: "content" }),
    str("tabPrimaryLabel", "First tab name", undefined, { group: "content" }),
    defineField({ name: "primaryServices", title: "First tab: service cards", type: "array", group: "content", of: [serviceCard] }),
    str("tabSecondaryLabel", "Second tab name", undefined, { group: "content" }),
    defineField({ name: "addOnServices", title: "Second tab: service cards", type: "array", group: "content", of: [serviceCard] }),
    str("ctaTitle", "Bottom call: title", undefined, { group: "content" }),
    text("ctaText", "Bottom call: text", undefined, { group: "content" }),
    str("ctaPrimaryLabel", "Bottom call: main button", "Links to the contact page.", { group: "content" }),
    str("ctaSecondaryLabel", "Bottom call: second button", "Links to the contact page.", { group: "content" }),
    ...seoFields("seo"),
  ],
  preview: { prepare: () => ({ title: "Services page" }) },
});

export const storiesPage = defineType({
  name: "storiesPage",
  title: "Stories page",
  type: "document",
  fields: [
    str("title", "Page title", 'e.g. "Stories"'),
    ...seoFields(),
  ],
  preview: { prepare: () => ({ title: "Stories page" }) },
});

export const story = defineType({
  name: "story",
  title: "Student story",
  type: "document",
  fields: [
    str("name", "Student's first name", "Used for ordering and the link text.", {
      validation: (rule: Rule) => rule.required(),
    }),
    str("headline", "Headline", undefined, {
      validation: (rule: Rule) => rule.required(),
    }),
    text("summary", "Summary", "Two or three sentences shown on the card."),
    imageField("photo", "Photo"),
    str("linkLabel", "Link text", 'e.g. "Read Nihal\'s story →". Leave empty to hide the link.'),
    defineField({
      name: "linkHref",
      title: "Link target",
      type: "string",
      description: "Where the link goes, e.g. /stories or a web address. Leave empty to hide the link.",
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers first.",
    }),
    defineField({
      name: "hidden",
      title: "Hide from the website",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [{ title: "Display order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "headline", subtitle: "name", media: "photo", hidden: "hidden" },
    prepare({ title, subtitle, media, hidden }) {
      return { title: hidden ? `${title} (hidden)` : title, subtitle, media };
    },
  },
});

export const privacyPage = defineType({
  name: "privacyPage",
  title: "Privacy policy page",
  type: "document",
  fields: [
    str("eyebrow", "Small line above the title", 'e.g. "Legal"'),
    str("title", "Title"),
    str("lastUpdated", "Last updated", 'e.g. "April 2025"'),
    text("intro", "Intro paragraph"),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "policySection",
          fields: [str("title", "Heading"), rich("bodyRich", "Text")],
          preview: { select: { title: "title" } },
        }),
      ],
    }),
    ...seoFields(),
  ],
  preview: { prepare: () => ({ title: "Privacy policy page" }) },
});
