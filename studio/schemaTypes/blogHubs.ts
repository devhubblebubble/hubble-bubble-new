import { defineArrayMember, defineField, defineType, type Rule } from "sanity";
import { COUNTRY_OPTIONS } from "./blog";
import { str, text } from "./helpers";

// The blog's two ways in by country:
//   Study destinations  /blog/study-in/<slug>/       (the UK, the USA, Europe...)
//   Home countries      /blog/students-from/<slug>/  (India, Nigeria, the UAE...)
// Each page shows its main guide in full, then lists more posts and links to
// the other kind of page. The starting ones come from
// content/seed/blog-destinations.json and blog-origins.json.

// Regions for grouping home countries on /blog/. The site uses the same list
// (src/lib/blog/hubs.mjs, REGIONS): add a region in both places.
export const REGION_OPTIONS = [
  { title: "South Asia", value: "south-asia" },
  { title: "East Asia", value: "east-asia" },
  { title: "South-East Asia", value: "south-east-asia" },
  { title: "Central Asia", value: "central-asia" },
  { title: "The Middle East", value: "middle-east" },
  { title: "Africa", value: "africa" },
  { title: "Europe", value: "europe" },
  { title: "The Americas", value: "americas" },
  { title: "Oceania", value: "oceania" },
];

type Kind = "destination" | "origin";

const WORDS: Record<Kind, { before: string; example: string; slug: string; base: string }> = {
  destination: { before: "Study in", example: '"the UK"', slug: "uk", base: "/blog/study-in/" },
  origin: { before: "Students from", example: '"the UAE"', slug: "nigeria", base: "/blog/students-from/" },
};

const postRef = () => defineArrayMember({ type: "reference", to: [{ type: "post" }], weak: true });

function hubFields(kind: Kind) {
  const w = WORDS[kind];
  return [
    str("name", "Name", "As shown on the blog page and in the menu of countries.", {
      validation: (rule: Rule) => rule.required(),
    }),
    str(
      "nameInSentence",
      "Name in a sentence (optional)",
      `How the name reads after "${w.before}", e.g. ${w.example}. Leave empty to use the name.`,
    ),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      description: `e.g. ${w.slug} gives ${w.base}${w.slug}/. Changing it later breaks links people already have.`,
      options: { source: "name", maxLength: 40 },
      validation: (rule) => rule.required(),
    }),
    str("flag", "Flag", "The country's two-letter code, e.g. gb for the UK or ng for Nigeria. Use eu for the EU flag.", {
      validation: (rule: Rule) =>
        rule.regex(/^[a-z]{2}(-[a-z]{3})?$/i, { name: "two-letter code", invert: false }),
    }),
    ...(kind === "destination"
      ? [
          defineField({
            name: "isoCodes",
            title: "Countries on this page",
            type: "array",
            description:
              'Posts that cover any of these countries (their "Countries this post covers") are listed on this page.',
            of: [{ type: "string" }],
            options: { list: COUNTRY_OPTIONS, layout: "grid" },
            validation: (rule) => rule.required().min(1),
          }),
        ]
      : [
          defineField({
            name: "region",
            title: "Region",
            type: "string",
            description: "The group this country is shown in on the blog page.",
            options: { list: REGION_OPTIONS },
            validation: (rule) => rule.required(),
          }),
        ]),
    text(
      "intro",
      "Short description",
      "One sentence. Shown at the top of the page while it has no main guide, and in search results then.",
    ),
    defineField({
      name: "guide",
      title: "Main guide",
      type: "reference",
      to: [{ type: "post" }],
      weak: true,
      description:
        "The post shown in full on this page. Its own address then sends people here. Until a main guide is picked, this page is left off the blog page and out of search results.",
    }),
    defineField({
      name: "featured",
      title: "List these posts first (optional)",
      type: "array",
      description:
        kind === "destination"
          ? "The page already lists every post that covers its countries. Pick posts here to show them first."
          : 'The page already lists every post written for students from this country ("Written for students from" on the post). Pick general posts that matter most to them here.',
      of: [postRef()],
      validation: (rule) => rule.unique(),
    }),
    defineField({
      name: "order",
      title: "Order on the blog page",
      type: "number",
      description: "Lower numbers first.",
    }),
  ];
}

const hubPreview = (kind: Kind) => ({
  select: { title: "name", slug: "slug.current", guide: "guide.title" },
  prepare: ({ title, slug, guide }: { title?: string; slug?: string; guide?: string }) => ({
    title: title || "Untitled",
    subtitle: [slug ? `${WORDS[kind].base}${slug}/` : null, guide ? `Main guide: ${guide}` : "No main guide yet"]
      .filter(Boolean)
      .join(" · "),
  }),
});

const byOrder = [{ title: "Order on the blog page", name: "order", by: [{ field: "order", direction: "asc" as const }] }];

export const blogDestination = defineType({
  name: "blogDestination",
  title: "Study destination",
  type: "document",
  fields: hubFields("destination"),
  orderings: byOrder,
  preview: hubPreview("destination"),
});

export const blogOrigin = defineType({
  name: "blogOrigin",
  title: "Home country",
  type: "document",
  fields: hubFields("origin"),
  orderings: byOrder,
  preview: hubPreview("origin"),
});
