import { defineField, defineType } from "sanity";

const url = (name: string, title: string, fieldset: "social" | "app") =>
  defineField({
    name,
    title,
    type: "url",
    fieldset,
    validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
  });

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fieldsets: [
    { name: "contact", title: "Contact details" },
    { name: "social", title: "Social links (leave empty to hide)" },
    { name: "app", title: "HubbleX app links (leave empty to hide the badges)" },
  ],
  fields: [
    defineField({
      name: "siteName",
      title: "Site name",
      type: "string",
      initialValue: "Hubble Bubble",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "legalName",
      title: "Legal name",
      type: "string",
      description: "The registered company name, e.g. Research in Dreams Ltd.",
    }),
    defineField({
      name: "tagline",
      title: "One-line description",
      type: "string",
      description:
        "Used in search results and structured data when a page has no description of its own.",
      validation: (rule) => rule.max(200),
    }),

    // ── Contact ────────────────────────────────────────────────────────
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      fieldset: "contact",
      description:
        "Shown in the footer and on the contact and jobs pages. Job applications go here.",
      validation: (rule) =>
        rule.required().email().error("Enter a valid email address"),
    }),
    defineField({
      name: "phone",
      title: "Phone number",
      type: "string",
      fieldset: "contact",
      description:
        "As it should appear, e.g. +44 131 000 0000. Leave empty to hide.",
    }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp number",
      type: "string",
      fieldset: "contact",
      description:
        "Country code and number, digits only, e.g. 447700900123. Leave empty to hide the WhatsApp button.",
      validation: (rule) =>
        rule.regex(/^\d*$/).error("Digits only, no spaces, plus sign or dashes"),
    }),
    defineField({
      name: "bookingUrl",
      title: "Book a call link",
      type: "url",
      fieldset: "contact",
      description: "e.g. your Calendly link. Leave empty to hide.",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "address",
      title: "Postal address",
      type: "text",
      rows: 3,
      fieldset: "contact",
      description: "One line per row, as it should appear in the footer.",
    }),

    // ── Social ─────────────────────────────────────────────────────────
    url("instagram", "Instagram", "social"),
    url("linkedin", "LinkedIn", "social"),
    url("facebook", "Facebook", "social"),
    url("youtube", "YouTube", "social"),
    url("tiktok", "TikTok", "social"),
    url("x", "X (Twitter)", "social"),

    // ── App ────────────────────────────────────────────────────────────
    url("googlePlayUrl", "Google Play link", "app"),
    url("appStoreUrl", "App Store link", "app"),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
