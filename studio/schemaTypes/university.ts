import { defineField, defineType } from "sanity";
import { imageField, str } from "./helpers";

/**
 * A university whose logo can be picked on student cards. Upload each logo
 * once here, then choose the university from the list wherever it is needed.
 */
export const university = defineType({
  name: "university",
  title: "University",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: 'The full name, e.g. "University of Cambridge".',
      validation: (rule) => rule.required(),
    }),
    str(
      "shortName",
      "Short name",
      'Shown on the site when there is no logo, e.g. "UAL" or "St Andrews". Leave empty to show the full name.',
    ),
    imageField(
      "logo",
      "Logo",
      "Best as an SVG, or a PNG at least 600 pixels wide, with a transparent background and no empty space around the logo. Logos are shown in white on the dark site, so any colour works. Small images look blurry on big screens.",
    ),
  ],
  orderings: [{ title: "Name", name: "nameAsc", by: [{ field: "name", direction: "asc" }] }],
  preview: {
    select: { title: "name", subtitle: "shortName", media: "logo" },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: media ? subtitle : [subtitle, "no logo yet, name is shown"].filter(Boolean).join(" · "),
      media,
    }),
  },
});
