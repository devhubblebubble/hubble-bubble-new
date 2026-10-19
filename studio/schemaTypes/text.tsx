import React from "react";
import { defineArrayMember, defineType } from "sanity";

// Highlight decorators shown in the editor in the brand colours.
const Mint = (props: { children?: React.ReactNode }) => (
  <span style={{ color: "#2fb795", fontWeight: 600 }}>{props.children}</span>
);
const Orange = (props: { children?: React.ReactNode }) => (
  <span style={{ color: "#ff4f00", fontWeight: 600 }}>{props.children}</span>
);

const decorators = [
  { title: "Bold", value: "strong" },
  { title: "Italic", value: "em" },
  { title: "Mint highlight", value: "mint", component: Mint },
  { title: "Orange highlight", value: "orange", component: Orange },
];

// A heading or short line: no paragraphs styles or lists, only highlights.
// Press Shift+Enter for a line break.
export const styledText = defineType({
  name: "styledText",
  title: "Styled text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [{ title: "Text", value: "normal" }],
      lists: [],
      marks: { decorators, annotations: [] },
    }),
  ],
});

// Longer text: paragraphs, bullet and numbered lists, highlights and links.
export const richText = defineType({
  name: "richText",
  title: "Rich text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading", value: "h3" },
      ],
      lists: [
        { title: "Bullet list", value: "bullet" },
        { title: "Numbered list", value: "number" },
      ],
      marks: {
        decorators,
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              {
                name: "href",
                type: "url",
                title: "Web address",
                validation: (rule) =>
                  rule.uri({ scheme: ["http", "https", "mailto", "tel"], allowRelative: true }),
              },
            ],
          },
        ],
      },
    }),
  ],
});
