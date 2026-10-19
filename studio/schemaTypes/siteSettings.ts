import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "siteName",
      title: "Site name",
      type: "string",
      initialValue: "Hubble Bubble",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
      description:
        "Where job applications and 'Email us' messages go. Used on the jobs pages.",
      validation: (rule) =>
        rule.required().email().error("Enter a valid email address"),
    }),
    defineField({
      name: "whatsappNumber",
      title: "WhatsApp number",
      type: "string",
      description:
        "Optional. Country code and number, digits only, e.g. 447700900123. Leave empty to hide the WhatsApp button.",
      validation: (rule) =>
        rule.regex(/^\d*$/).error("Digits only, no spaces, plus sign or dashes"),
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
