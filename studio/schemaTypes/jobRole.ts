import { defineField, defineType } from "sanity";

const COUNTRIES = [
  "Ireland",
  "Germany",
  "United Kingdom",
  "Netherlands",
  "Belgium",
  "Luxembourg",
  "France",
  "Austria",
  "Switzerland",
  "Denmark",
  "Sweden",
  "Norway",
  "Finland",
  "Iceland",
  "Italy",
  "Spain",
  "Portugal",
  "Malta",
  "Cyprus",
  "Poland",
  "Czechia",
  "Slovakia",
  "Hungary",
  "Croatia",
  "Slovenia",
  "Lithuania",
  "Latvia",
  "Estonia",
  "Australia",
  "New Zealand",
  "Canada",
  "United States",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Singapore",
  "Japan",
  "South Korea",
];

const EMPLOYMENT_TYPES = [
  { title: "Full-time", value: "full-time" },
  { title: "Part-time", value: "part-time" },
  { title: "Fixed-term contract", value: "fixed-term" },
  { title: "Internship", value: "internship" },
];

const CURRENCIES = ["EUR", "GBP", "USD", "AUD", "CAD", "CHF", "AED", "SGD"];

const SALARY_PERIODS = [
  { title: "Per hour", value: "HOUR" },
  { title: "Per day", value: "DAY" },
  { title: "Per week", value: "WEEK" },
  { title: "Per month", value: "MONTH" },
  { title: "Per year", value: "YEAR" },
];

const stringList = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    description,
    type: "array",
    of: [{ type: "string" }],
    group: "description",
  });

export const jobRole = defineType({
  name: "jobRole",
  title: "Job role",
  type: "document",
  groups: [
    { name: "role", title: "Role", default: true },
    { name: "pay", title: "Contract and pay" },
    { name: "description", title: "Description" },
    { name: "apply", title: "Dates, apply and search" },
  ],
  fields: [
    // ── Role ────────────────────────────────────────────────────────────
    defineField({
      name: "title",
      title: "Job title",
      type: "string",
      group: "role",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      type: "slug",
      group: "role",
      description:
        "The role's page address, e.g. civil-engineer-ireland. Click Generate after typing the title and country. Changing it later breaks links people already have.",
      options: {
        source: (doc) =>
          [doc.title, doc.country].filter(Boolean).join(" "),
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "role",
      description: "Closed roles stay saved here but disappear from the website.",
      options: {
        list: [
          { title: "Open", value: "open" },
          { title: "Closed", value: "closed" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "open",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "reference",
      title: "Reference",
      type: "string",
      group: "role",
      description:
        "Short reference shown to candidates and used in the application email, e.g. HB-IE-001.",
    }),
    defineField({
      name: "employer",
      title: "Employer",
      type: "string",
      group: "role",
      description:
        "Leave empty to show 'Confidential'. Only name an employer you are authorised to advertise for.",
    }),
    defineField({
      name: "country",
      title: "Country",
      type: "string",
      group: "role",
      options: { list: COUNTRIES },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "city",
      title: "City or cities",
      type: "string",
      group: "role",
      description:
        "e.g. Dublin, or Berlin, Munich, Frankfurt or Hamburg. Leave empty if not fixed.",
    }),
    defineField({
      name: "sector",
      title: "Sector",
      type: "string",
      group: "role",
      description: "e.g. Engineering, Healthcare, Skilled trades.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "visaSponsorship",
      title: "Visa sponsorship available",
      type: "boolean",
      group: "role",
      initialValue: true,
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      group: "role",
      description:
        "One or two sentences shown on the role card and in search results.",
      validation: (rule) => rule.required().max(320),
    }),

    // ── Contract and pay ───────────────────────────────────────────────
    defineField({
      name: "employmentType",
      title: "Employment type",
      type: "array",
      group: "pay",
      of: [{ type: "string" }],
      options: { list: EMPLOYMENT_TYPES, layout: "grid" },
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "contractDetails",
      title: "Contract details",
      type: "string",
      group: "pay",
      description: "e.g. 2 to 3 years, depending on experience. Optional.",
    }),
    defineField({
      name: "salaryText",
      title: "Salary (as shown to candidates)",
      type: "string",
      group: "pay",
      description:
        "e.g. €2,200 to €2,500 per month, or Competitive, based on experience. Leave empty to hide.",
    }),
    defineField({
      name: "salaryCurrency",
      title: "Salary currency",
      type: "string",
      group: "pay",
      options: { list: CURRENCIES },
      description:
        "The next four fields are optional. Fill them in when the salary is a known figure or range, so Google can show it in search results.",
    }),
    defineField({
      name: "salaryMin",
      title: "Salary from",
      type: "number",
      group: "pay",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "salaryMax",
      title: "Salary to",
      type: "number",
      group: "pay",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "salaryPeriod",
      title: "Salary period",
      type: "string",
      group: "pay",
      options: { list: SALARY_PERIODS },
    }),
    defineField({
      name: "processingTime",
      title: "Processing time",
      type: "string",
      group: "pay",
      description:
        "Typical time from application to first day, including the visa, e.g. 4 to 6 months (estimate). Leave empty to show 'Ask us'.",
    }),

    // ── Description ────────────────────────────────────────────────────
    defineField({
      name: "about",
      title: "About the role",
      type: "blockContent",
      group: "description",
      description: "Level, reporting line, career path, how selection works.",
    }),
    stringList(
      "responsibilities",
      "What you will do",
      "One line per item. Leave empty to hide the section.",
    ),
    stringList(
      "requirements",
      "What you need",
      "Essential criteria, one line per item.",
    ),
    stringList(
      "desirable",
      "Good to have",
      "Nice-to-have criteria, one line per item.",
    ),
    stringList(
      "benefits",
      "What you get",
      "Benefits and package, one line per item.",
    ),

    // ── Dates, apply and search ────────────────────────────────────────
    defineField({
      name: "datePosted",
      title: "Date posted",
      type: "date",
      group: "apply",
      initialValue: () => new Date().toISOString().slice(0, 10),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "closingDate",
      title: "Closing date",
      type: "date",
      group: "apply",
      description:
        "Last day to apply. The role disappears from the website after this date. Google also uses it to know when the listing expires.",
    }),
    defineField({
      name: "applyUrl",
      title: "Application form link",
      type: "url",
      group: "apply",
      description:
        "Optional. Leave empty and candidates apply by email to the contact address in Site settings.",
    }),
    defineField({
      name: "seoTitle",
      title: "Search result title",
      type: "string",
      group: "apply",
      description:
        "Optional. Shown in Google results. Defaults to the job title and country.",
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: "seoDescription",
      title: "Search result description",
      type: "text",
      rows: 2,
      group: "apply",
      description: "Optional. Defaults to the summary.",
      validation: (rule) => rule.max(170),
    }),
  ],
  orderings: [
    {
      title: "Country, then newest",
      name: "countryNewest",
      by: [
        { field: "country", direction: "asc" },
        { field: "datePosted", direction: "desc" },
      ],
    },
    {
      title: "Newest first",
      name: "newest",
      by: [{ field: "datePosted", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      country: "country",
      status: "status",
      reference: "reference",
    },
    prepare({ title, country, status, reference }) {
      const bits = [country, reference].filter(Boolean).join(" · ");
      return {
        title: status === "closed" ? `${title} (closed)` : title,
        subtitle: bits,
      };
    },
  },
});
