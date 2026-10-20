import { defineArrayMember, defineField, defineType, type Rule } from "sanity";
import { imageField, seoFields, str, text } from "./helpers";

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  groups: [
    { name: "hero", title: "Top of page", default: true },
    { name: "trust", title: "Trust cards" },
    { name: "journey", title: "Journey steps" },
    { name: "stories", title: "Stories and testimonials" },
    { name: "gallery", title: "Gallery (round bubbles)" },
    { name: "bottom", title: "Bottom of page" },
    { name: "seo", title: "Search" },
  ],
  fields: [
    // ── Hero ───────────────────────────────────────────────────────────
    str("headlineLead", "Headline, first line", 'e.g. "We are the"', { group: "hero" }),
    str("headlineAccent", "Headline, orange line", 'e.g. "Anti-Agent Agents!"', { group: "hero" }),
    text("headlineRest", "Headline, remaining lines", "One line per row.", { group: "hero" }),
    str("subLead", "Subtitle, grey part", 'e.g. "So stop guessing."', { group: "hero" }),
    str("subHighlight", "Subtitle, white part", 'e.g. "Let\'s find the degree"', { group: "hero" }),
    str("subRest", "Subtitle, last line (grey)", undefined, { group: "hero" }),
    str("accreditationsLabel", "Accreditations label", 'e.g. "Accredited by:"', { group: "hero" }),
    defineField({
      name: "accreditations",
      title: "Accreditation logos",
      type: "array",
      group: "hero",
      of: [
        defineArrayMember({
          type: "object",
          name: "logoItem",
          fields: [str("name", "Name"), imageField("logo", "Logo")],
          preview: { select: { title: "name", media: "logo" } },
        }),
      ],
    }),
    str("primaryCtaLabel", "Main button", 'Opens the eligibility test. e.g. "Take the eligibility Test"', { group: "hero" }),
    str("secondaryCtaLabel", "Second button", 'e.g. "Book a call"', { group: "hero" }),
    str("secondaryCtaHref", "Second button link", "e.g. /contact", { group: "hero" }),
    defineField({
      name: "heroStudents",
      title: "Student cards (next to the headline)",
      description:
        "One card per student; the cards rotate every few seconds. Upload the student's photo here and pick their university admits from the Universities list (left menu), where each logo is uploaded once.",
      type: "array",
      group: "hero",
      of: [
        defineArrayMember({
          type: "object",
          name: "heroStudent",
          fields: [
            str("name", "Name"),
            str("course", "Course"),
            str(
              "flag",
              "Country",
              "Where the student is going to study: the 2-letter country code, e.g. GB, IE, AU, CA or US. Shown as a round flag next to the photo.",
              {
                validation: (rule: Rule) =>
                  rule.custom((value: unknown) => {
                    if (typeof value !== "string" || !value.trim()) return true;
                    const v = value.trim();
                    const ok = /^[A-Za-z]{2}$/.test(v) || /^[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(v);
                    return ok || "Use the 2-letter country code, e.g. GB for the UK or IE for Ireland. Without it no flag is shown.";
                  }).warning(),
              },
            ),
            imageField("photo", "Photo", "A square photo works best; it is shown in a circle."),
            defineField({
              name: "admits",
              title: "University admits",
              description:
                "Add one item per university and pick it from the list. New university? Add it once under Universities in the left menu (with its logo), then it appears here.",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "admit",
                  title: "University",
                  fieldsets: [
                    {
                      name: "oneOff",
                      title: "Not in the list? Type a name or upload a logo instead",
                      options: { collapsible: true, collapsed: true },
                    },
                  ],
                  fields: [
                    defineField({
                      name: "university",
                      title: "University",
                      type: "reference",
                      to: [{ type: "university" }],
                      // Deleting a university must not be blocked by the cards that use it;
                      // the site simply skips an admit whose university no longer exists.
                      weak: true,
                    }),
                    {
                      ...str("label", "University name (one-off)", "Only used when no university is picked above."),
                      fieldset: "oneOff",
                    },
                    {
                      ...imageField("logo", "Logo (one-off)", "Only used when no university is picked above."),
                      fieldset: "oneOff",
                    },
                  ],
                  preview: {
                    select: { uniName: "university.name", uniLogo: "university.logo", label: "label", logo: "logo" },
                    prepare: ({ uniName, uniLogo, label, logo }) => ({
                      title: uniName || label || "Choose a university",
                      media: uniLogo || logo,
                    }),
                  },
                }),
              ],
            }),
          ],
          preview: { select: { title: "name", subtitle: "course", media: "photo" } },
        }),
      ],
    }),
    str("worldMapHeadline", "Headline under the world map", undefined, { group: "hero" }),

    // ── Trust cards ────────────────────────────────────────────────────
    text("backingText", "Card 1: text", undefined, { group: "trust" }),
    text("backingHeading", "Card 1: heading", "One line per row.", { group: "trust" }),
    imageField("backingLogo", "Card 1: logo", undefined, { group: "trust" }),
    text("certifiedHeading", "Card 2: heading", "One line per row.", { group: "trust" }),
    defineField({
      name: "certifiedLogos",
      title: "Card 2: logos",
      type: "array",
      group: "trust",
      of: [
        defineArrayMember({
          type: "object",
          name: "logoItem",
          fields: [str("name", "Name"), imageField("logo", "Logo")],
          preview: { select: { title: "name", media: "logo" } },
        }),
      ],
    }),
    text("certifiedText", "Card 2: text", undefined, { group: "trust" }),
    text("networkHeading", "Card 3: heading", "One line per row.", { group: "trust" }),
    text("networkText", "Card 3: text", undefined, { group: "trust" }),
    defineField({
      name: "networkItems",
      title: "Card 3: scrolling partner strip",
      description: "Each entry shows its logo if one is uploaded, otherwise its name.",
      type: "array",
      group: "trust",
      of: [
        defineArrayMember({
          type: "object",
          name: "networkItem",
          fields: [str("name", "Name"), imageField("logo", "Logo (optional)")],
          preview: { select: { title: "name", media: "logo" } },
        }),
      ],
    }),

    // ── Journey ────────────────────────────────────────────────────────
    defineField({
      name: "journeySteps",
      title: "Journey steps",
      type: "array",
      group: "journey",
      of: [
        defineArrayMember({
          type: "object",
          name: "journeyStep",
          fields: [
            str("number", "Number", 'e.g. "01"'),
            str("title", "Title (white part)", 'e.g. "Your journey starts with the"'),
            str("titleHighlight", "Title (orange part)", 'e.g. "real you."'),
            text("description", "Description"),
            defineField({ name: "tags", title: "Key outputs", type: "array", of: [{ type: "string" }] }),
          ],
          preview: { select: { title: "title", subtitle: "titleHighlight" } },
        }),
      ],
    }),
    str("journeyOutputsLabel", "Label above the key outputs", 'e.g. "Key Outputs"', { group: "journey" }),

    // ── Stories and testimonials ───────────────────────────────────────
    str("storiesTitle", "Stories section title", 'e.g. "Student Stories"', { group: "stories" }),
    str("storiesViewAllLabel", "View all link text", undefined, { group: "stories" }),
    defineField({
      name: "featuredStories",
      title: "Stories shown on the home page",
      description: "Pick from the Stories list. Leave empty to show the first two.",
      type: "array",
      group: "stories",
      of: [defineArrayMember({ type: "reference", to: [{ type: "story" }] })],
    }),
    str("testimonialsTitle", "Testimonials title", undefined, { group: "stories" }),
    text("testimonialsLead", "Testimonials intro", undefined, { group: "stories" }),
    defineField({
      name: "testimonials",
      title: "Testimonials",
      type: "array",
      group: "stories",
      of: [
        defineArrayMember({
          type: "object",
          name: "testimonial",
          fields: [
            imageField("photo", "Photo"),
            text("quote", "Quote"),
            str("name", "Name"),
            str("course", "Course"),
            str("university", "University"),
            defineField({
              name: "large",
              title: "Show the quote in large text",
              type: "boolean",
              description: "Use for short quotes.",
              initialValue: false,
            }),
          ],
          preview: { select: { title: "name", subtitle: "university", media: "photo" } },
        }),
      ],
    }),

    // ── Gallery ────────────────────────────────────────────────────────
    str("galleryTitle", "Title", 'e.g. "Look Who\'ve Noticed Us!"', { group: "gallery" }),
    str("galleryLead", "Line under the title", undefined, { group: "gallery" }),
    str("galleryHint", "Line under the bubbles", 'e.g. "Tap a bubble to read the story behind it."', {
      group: "gallery",
    }),
    defineField({
      name: "galleryItems",
      title: "Bubbles",
      description:
        "The first bubble is the big one in the middle. The others repeat around it and get smaller towards the edge, so 6 to 10 bubbles looks best. A bubble with a story opens a round card when someone taps it; a bubble without a story is just decoration. Only add awards, partners and logos you are allowed to show.",
      type: "array",
      group: "gallery",
      of: [
        defineArrayMember({
          type: "object",
          name: "galleryItem",
          fields: [
            str("name", "Name", 'e.g. "Bank of Scotland"', { validation: (rule: Rule) => rule.required() }),
            defineField({
              name: "style",
              title: "Look",
              type: "string",
              options: {
                layout: "radio",
                list: [
                  { title: "Logo or short text on a coloured bubble", value: "logo" },
                  { title: "Photo", value: "photo" },
                ],
              },
              initialValue: "logo",
            }),
            defineField({
              name: "color",
              title: "Bubble colour",
              description: "Used for logo bubbles, and behind the text of the card.",
              type: "string",
              options: {
                list: [
                  { title: "Navy", value: "navy" },
                  { title: "Indigo", value: "indigo" },
                  { title: "Teal", value: "teal" },
                  { title: "Blue", value: "blue" },
                  { title: "Green", value: "green" },
                  { title: "Gold", value: "gold" },
                ],
              },
              initialValue: "navy",
            }),
            imageField(
              "image",
              "Logo or photo",
              "A logo works best as a PNG or SVG with a transparent background, in white or a light colour. A photo works best square; it is shown in a circle.",
            ),
            str(
              "bubbleText",
              "Text on the bubble (when there is no logo)",
              'Short, e.g. "ISIC" or "in". Ignored when a logo is uploaded.',
            ),
            defineField({
              name: "icon",
              title: "Picture to show until a photo is uploaded",
              type: "string",
              options: {
                layout: "radio",
                list: [
                  { title: "Trophy", value: "trophy" },
                  { title: "Handshake", value: "handshake" },
                ],
              },
              hidden: ({ parent }) => parent?.style !== "photo",
            }),
            text(
              "description",
              "Story (shown when someone taps the bubble)",
              "Two or three short sentences, about 200 characters at most so it fits the round card. Leave empty and the bubble is just decoration. Only claims you can back up.",
              {
                validation: (rule: Rule) =>
                  rule.max(240).warning("Long stories get very small type on the round card. Try to keep it under 200 characters."),
              },
            ),
          ],
          preview: {
            select: { title: "name", subtitle: "description", media: "image" },
            prepare: ({ title, subtitle, media }) => ({
              title: title || "Bubble",
              subtitle: subtitle ? "Opens a card" : "Decoration only",
              media,
            }),
          },
        }),
      ],
    }),

    // ── Bottom ─────────────────────────────────────────────────────────
    str("originTitleLead", "Origin: title (white part)", 'e.g. "How It All"', { group: "bottom" }),
    str("originTitleAccent", "Origin: title (orange part)", 'e.g. "Began"', { group: "bottom" }),
    str("originLead", "Origin: line under the title", undefined, { group: "bottom" }),
    str("originLeadAccent", "Origin: highlighted words", 'e.g. "Big Bang Theory"', { group: "bottom" }),
    str("originButtonLabel", "Origin: button text", 'e.g. "Read now!"', { group: "bottom" }),
    str("originButtonHref", "Origin: button link", "e.g. /about", { group: "bottom" }),
    text("ctaTitleLead", "Final call: title (white part)", "One line per row.", { group: "bottom" }),
    str("ctaTitleAccent", "Final call: title (orange part)", undefined, { group: "bottom" }),
    text("ctaText", "Final call: text", undefined, { group: "bottom" }),
    str("ctaPrimaryLabel", "Final call: main button", "Opens the eligibility test.", { group: "bottom" }),
    str("ctaSecondaryLabel", "Final call: second button", "Links to the contact page.", { group: "bottom" }),

    ...seoFields("seo"),
  ],
  preview: { prepare: () => ({ title: "Home page" }) },
});
