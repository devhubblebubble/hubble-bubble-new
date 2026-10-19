import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Job roles")
        .schemaType("jobRole")
        .child(
          S.documentTypeList("jobRole")
            .title("Job roles")
            .defaultOrdering([
              { field: "country", direction: "asc" },
              { field: "datePosted", direction: "desc" },
            ]),
        ),
      S.divider(),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings"),
        ),
    ]);
