import { defineArrayMember, defineField, defineType, type Rule } from "sanity";
import { seoFields, str, styled } from "./helpers";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  groups: [
    { name: "intro", title: "Intro", default: true },
    { name: "team", title: "Team" },
    { name: "story", title: "Our story" },
    { name: "mission", title: "Mission and vision" },
    { name: "cta", title: "Calls to action" },
    { name: "seo", title: "Search" },
  ],
  fields: [
    styled("intro1HeadingStyled", "First heading", "Use the mint highlight for the accent word.", { group: "intro" }),
    styled("intro1BodyStyled", "First paragraph", undefined, { group: "intro" }),
    styled("intro2HeadingStyled", "Second heading", undefined, { group: "intro" }),
    styled("intro2BodyStyled", "Second paragraph", undefined, { group: "intro" }),

    styled("teamHeadingStyled", "Team heading", undefined, { group: "team" }),
    styled("teamSubStyled", "Team intro", undefined, { group: "team" }),
    defineField({
      name: "team",
      title: "Team members shown",
      description: "Pick from the Team members list, in display order.",
      type: "array",
      group: "team",
      of: [defineArrayMember({ type: "reference", to: [{ type: "teamMember" }] })],
    }),

    styled("timelineHeadingStyled", "Story heading", undefined, { group: "story" }),
    str("timelineButtonLabel", "Story button text", undefined, { group: "story" }),
    defineField({
      name: "timeline",
      title: "Timeline",
      type: "array",
      group: "story",
      of: [
        defineArrayMember({
          type: "object",
          name: "timelineItem",
          fields: [
            str("year", "Year"),
            str("title", "Title"),
            defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
          ],
          preview: { select: { title: "title", subtitle: "year" } },
        }),
      ],
    }),

    styled("missionLabelStyled", "Mission heading", undefined, { group: "mission" }),
    str("missionAlias", "Mission subheading", 'e.g. "a. k. a the mission"', { group: "mission" }),
    styled("missionBodyStyled", "Mission text", "Use the orange highlight for key words.", { group: "mission" }),
    styled("visionLabelStyled", "Vision heading", undefined, { group: "mission" }),
    str("visionAlias", "Vision subheading", undefined, { group: "mission" }),
    styled("visionBodyStyled", "Vision text", undefined, { group: "mission" }),

    styled("ctaEyebrowStyled", "Student call: small line above", undefined, { group: "cta" }),
    str("ctaTitle", "Student call: title", undefined, { group: "cta" }),
    styled("ctaSubStyled", "Student call: text", undefined, { group: "cta" }),
    str("ctaPrimaryLabel", "Student call: main button", "Links to the contact page.", { group: "cta" }),
    str("ctaSecondaryLabel", "Student call: second button", "Links to the contact page.", { group: "cta" }),
    styled("collabHeadingStyled", "Partner call: heading", undefined, { group: "cta" }),
    styled("collabSubStyled", "Partner call: text", undefined, { group: "cta" }),
    str("collabButtonLabel", "Partner call: button", "Links to the collaboration form.", { group: "cta" }),
    str("collabEmailLabel", "Partner call: text before the email address", "The address itself comes from Site settings.", { group: "cta" }),

    ...seoFields("seo"),
  ],
  preview: { prepare: () => ({ title: "About page" }) },
});

export const teamMember = defineType({
  name: "teamMember",
  title: "Team member",
  type: "document",
  fields: [
    str("name", "Name", undefined, { validation: (rule: Rule) => rule.required() }),
    str("title", "Role title", 'e.g. "Chief Pathfinder"'),
    str("aka", "Also known as", 'e.g. "Founder". Shown after "a.k.a".'),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", title: "Description", type: "string" }],
    }),
    defineField({
      name: "photoAlt",
      title: "Second photo (revealed on hover)",
      type: "image",
      options: { hotspot: true },
      description: "Optional. Falls back to the main photo.",
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers first.",
    }),
  ],
  orderings: [{ title: "Display order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "title", media: "photo" } },
});
