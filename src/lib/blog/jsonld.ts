// Structured data for the blog pages.
// References: https://developers.google.com/search/docs/appearance/structured-data/article
// and https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
import { siteUrl } from "@/lib/site";
import type { BlogTopic, Post, PostLink } from "@/lib/sanity/types";

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

export const postPath = (slug: string) => `/blog/${slug}/`;
export const topicPath = (slug: string) => `/blog/topics/${slug}/`;

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

export function blogPostingJsonLd(post: Post) {
  const url = `${siteUrl}${postPath(post.slug)}`;
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

/** The blog page or a topic page, with its posts as a list. */
export function collectionJsonLd({
  name,
  description,
  path,
  posts,
}: {
  name: string;
  description?: string;
  path: string;
  posts: (Post | PostLink)[];
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
        url: `${siteUrl}${postPath(p.slug)}`,
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
