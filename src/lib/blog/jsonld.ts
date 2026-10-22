// Structured data for the blog pages.
// References: https://developers.google.com/search/docs/appearance/structured-data/article
// and https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
import { siteUrl } from "@/lib/site";
import type { BlogTopic, Post, PostLink } from "@/lib/sanity/types";
import { postHref, postPath, topicPath } from "./urls.mjs";

const ORG_ID = `${siteUrl}/#organization`;
const SOCIAL_IMAGE = `${siteUrl}/images/social/og-default.jpg`;

// The same organisation as the home page's Organization data (same @id).
const organisation = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Hubble Bubble",
  url: `${siteUrl}/`,
  logo: `${siteUrl}/images/logos/footer-hubblebubble.png`,
};

// The addresses live in urls.mjs; these are here too for older imports.
export { postPath, topicPath };

export type Crumb = { name: string; path: string };

export const breadcrumbJsonLd = (crumbs: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: `${siteUrl}${c.path}`,
  })),
});

/** A post. `path` is where it lives: a hub's address for a hub's main guide. */
export function blogPostingJsonLd(post: Post, path: string = postPath(post.slug)) {
  const url = `${siteUrl}${path}`;
  const author = post.author?.name
    ? { "@type": "Person", name: post.author.name, ...(post.author.title ? { jobTitle: post.author.title } : {}), worksFor: { "@id": ORG_ID } }
    : organisation;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.description || post.excerpt ? { description: post.description || post.excerpt } : {}),
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.reviewedAt || post.publishedAt ? { dateModified: post.reviewedAt || post.publishedAt } : {}),
    author,
    publisher: organisation,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    image: SOCIAL_IMAGE,
    inLanguage: "en-GB",
    isAccessibleForFree: true,
    ...(post.topic?.title ? { articleSection: post.topic.title } : {}),
  };
}

export function faqJsonLd(post: Post) {
  const items = (post.faq ?? []).filter((f) => f.question && f.answer);
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** The blog page, a topic page or a hub without a guide, with its posts as a list. */
export function collectionJsonLd({
  name,
  description,
  path,
  posts,
  guides,
}: {
  name: string;
  description?: string;
  path: string;
  posts: (Post | PostLink)[];
  /** Post slug -> hub address, so a hub's main guide is listed at the hub. */
  guides?: Map<string, string>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    ...(description ? { description } : {}),
    url: `${siteUrl}${path}`,
    inLanguage: "en-GB",
    isPartOf: { "@type": "WebSite", name: "Hubble Bubble", url: `${siteUrl}/` },
    publisher: { "@id": ORG_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${siteUrl}${postHref(p.slug, guides)}`,
        name: p.title,
      })),
    },
  };
}

export const topicCrumbs = (topic: Pick<BlogTopic, "title" | "slug">): Crumb[] => [
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog/" },
  { name: topic.title, path: topicPath(topic.slug) },
];
