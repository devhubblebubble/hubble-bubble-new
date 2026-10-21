import type { StructureResolver } from "sanity/structure";

const page = (S: Parameters<StructureResolver>[0], type: string, title: string) =>
  S.listItem()
    .title(title)
    .id(type)
    .child(S.document().schemaType(type).documentId(type));

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Pages")
        .child(
          S.list()
            .title("Pages")
            .items([
              page(S, "homePage", "Home page"),
              page(S, "aboutPage", "About page"),
              page(S, "servicesPage", "Services page"),
              page(S, "storiesPage", "Stories page"),
              page(S, "recruitmentPage", "Jobs page"),
              page(S, "contactPage", "Contact page"),
              page(S, "privacyPage", "Privacy policy page"),
            ]),
        ),
      S.divider(),
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
      S.listItem()
        .title("Student stories")
        .schemaType("story")
        .child(
          S.documentTypeList("story")
            .title("Student stories")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),
      S.listItem()
        .title("Team members")
        .schemaType("teamMember")
        .child(
          S.documentTypeList("teamMember")
            .title("Team members")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),
      S.listItem()
        .title("Universities")
        .schemaType("university")
        .child(
          S.documentTypeList("university")
            .title("Universities (logos)")
            .defaultOrdering([{ field: "name", direction: "asc" }]),
        ),
      S.divider(),
      S.listItem()
        .title("Blog")
        .id("blog")
        .child(
          S.list()
            .title("Blog")
            .items([
              S.listItem()
                .title("Posts")
                .schemaType("post")
                .child(
                  S.documentTypeList("post")
                    .title("Blog posts")
                    .defaultOrdering([{ field: "reviewedAt", direction: "desc" }]),
                ),
              S.listItem()
                .title("Topics")
                .schemaType("blogTopic")
                .child(
                  S.documentTypeList("blogTopic")
                    .title("Blog topics")
                    .defaultOrdering([{ field: "order", direction: "asc" }]),
                ),
            ]),
        ),
      S.divider(),
      page(S, "siteSettings", "Site settings"),
    ]);
