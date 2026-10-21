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

// ── Contact page ─────────────────────────────────────────────────────────
// The email address, booking link and social links come from Site settings.
export const contactPage = defineType({
  name: "contactPage",
  title: "Contact page",
  type: "document",
  groups: [
    { name: "top", title: "1. Top of page", default: true },
    { name: "left", title: "2. Left column" },
    { name: "form", title: "3. Message form" },
    { name: "seo", title: "Search (Google)" },
  ],
  fields: [
    str("eyebrow", "Small line above the title", 'e.g. "Get in touch"', { group: "top" }),
    str("titleLead", "Title (white part)", 'e.g. "Let\'s find your"', { group: "top" }),
    str("titleAccent", "Title (orange part)", 'e.g. "right direction."', { group: "top" }),
    text("lead", "Text under the title", undefined, { group: "top" }),

    str("emailLabel", "Email box: heading", 'e.g. "Email us directly". The address itself is set in Site settings.', { group: "left" }),
    str("bookingLabel", "Booking box: heading", 'e.g. "Book a call". Shown only when a booking link is set in Site settings.', { group: "left" }),
    str("bookingLinkText", "Booking box: link text", 'e.g. "Schedule a call"', { group: "left" }),
    str("locationLabel", "Location box: heading", 'e.g. "Based in"', { group: "left" }),
    str("locationText", "Location box: place", 'e.g. "Edinburgh, Scotland, UK"', { group: "left" }),
    str("socialsLabel", "Social links: heading", 'e.g. "Follow us". The links are set in Site settings.', { group: "left" }),
    str("eligTitle", "Eligibility box: title", 'e.g. "Not sure where to start?"', { group: "left" }),
    text("eligText", "Eligibility box: text", undefined, { group: "left" }),
    str("eligButton", "Eligibility box: button", "Opens the eligibility test.", { group: "left" }),

    str("tabStudent", "Form tab 1", 'e.g. "I\'m a student"', { group: "form" }),
    str("tabCollab", "Form tab 2", 'e.g. "Collaboration"', { group: "form" }),
    str("tabGeneral", "Form tab 3", 'e.g. "General"', { group: "form" }),
    str("nameLabel", "Name field: label", 'e.g. "Full name"', { group: "form" }),
    str("emailFieldLabel", "Email field: label", 'e.g. "Email"', { group: "form" }),
    str("countryLabel", "Country field: label (tab 1)", 'e.g. "Interested in studying"', { group: "form" }),
    defineField({
      name: "countries",
      title: "Country field: choices",
      description: "One per row, in the order shown.",
      type: "array",
      of: [{ type: "string" }],
      group: "form",
    }),
    str("levelLabel", "Study level field: label (tab 1)", 'e.g. "Study level"', { group: "form" }),
    defineField({
      name: "levels",
      title: "Study level field: choices",
      description: "One per row, in the order shown.",
      type: "array",
      of: [{ type: "string" }],
      group: "form",
    }),
    str("orgLabel", "Organisation field: label (tab 2)", 'e.g. "Organisation / Project"', { group: "form" }),
    str("messageLabel", "Message field: label", 'e.g. "Message"', { group: "form" }),
    text("messageHintStudent", "Message field: hint on tab 1", "The grey text shown in the empty box.", { group: "form" }),
    text("messageHintCollab", "Message field: hint on tab 2", undefined, { group: "form" }),
    str("messageHintGeneral", "Message field: hint on tab 3", undefined, { group: "form" }),
    str("sendButton", "Send button", 'e.g. "Send message"', { group: "form" }),
    str("privacyNote", "Line under the button", 'Followed by a link to the privacy policy. e.g. "We respect your privacy. Your details are never shared or sold."', { group: "form" }),
    str("successTitle", "After sending: title", 'e.g. "Message received!"', { group: "form" }),
    text("successText", "After sending: text", undefined, { group: "form" }),
    str("successLink", "After sending: link text", 'Links to the stories page. e.g. "Read student stories →"', { group: "form" }),

    ...seoFields("seo"),
  ],
  preview: { prepare: () => ({ title: "Contact page" }) },
});

// ── Jobs page (/recruitment) ─────────────────────────────────────────────
// The roles themselves are under Job roles in the left menu.
export const recruitmentPage = defineType({
  name: "recruitmentPage",
  title: "Jobs page",
  type: "document",
  groups: [
    { name: "top", title: "1. Top of page", default: true },
    { name: "how", title: "2. What happens after you apply" },
    { name: "bottom", title: "3. Bottom box" },
    { name: "seo", title: "Search (Google)" },
  ],
  fields: [
    str("eyebrow", "Small line above the title", 'e.g. "Recruitment"', { group: "top" }),
    str("heroTitle", "Title", 'e.g. "Job opportunities abroad"', { group: "top" }),
    text("heroSubtitle", "Text under the title", undefined, { group: "top" }),
    str("byCountryLabel", "Label before the country buttons", 'e.g. "Roles by country"', { group: "top" }),
    str("emptyTitle", "When there are no open roles: title", undefined, { group: "top" }),
    text("emptyText", "When there are no open roles: text", undefined, { group: "top" }),

    str("howTitle", "Title", 'e.g. "What happens after you apply"', { group: "how" }),
    text("howIntro", "Text under the title", undefined, { group: "how" }),
    defineField({
      name: "steps",
      title: "Steps",
      type: "array",
      group: "how",
      of: [
        defineArrayMember({
          type: "object",
          name: "step",
          fields: [str("title", "Title"), text("text", "Text")],
          preview: { select: { title: "title", subtitle: "text" } },
        }),
      ],
    }),

    str("contactTitle", "Title", 'e.g. "Not seeing the right role?"', { group: "bottom" }),
    text("contactText", "Text", undefined, { group: "bottom" }),
    str("emailButton", "Email button", 'e.g. "Email us". Uses the email in Site settings.', { group: "bottom" }),
    str("whatsappButton", "WhatsApp button", "Shown only when a WhatsApp number is set in Site settings.", { group: "bottom" }),

    ...seoFields("seo"),
  ],
  preview: { prepare: () => ({ title: "Jobs page" }) },
});
