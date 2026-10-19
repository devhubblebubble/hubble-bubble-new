import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

// Documents that exist exactly once (no "create new" and no delete).
const SINGLETONS = new Set(["siteSettings"]);

export default defineConfig({
  name: "default",
  title: "Hubble Bubble",

  projectId: "qstbrsll",
  dataset: "production",

  plugins: [structureTool({ structure })],

  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter((t) => !SINGLETONS.has(t.schemaType)),
  },

  document: {
    actions: (actions, context) =>
      SINGLETONS.has(context.schemaType)
        ? actions.filter(
            (a) => !["unpublish", "delete", "duplicate"].includes(a.action ?? ""),
          )
        : actions,
  },
});
