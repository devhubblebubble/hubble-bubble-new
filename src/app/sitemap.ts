import type { MetadataRoute } from "next";
import { postPath, topicPath } from "@/lib/blog/jsonld";
import { getBlogTopics, getOpenRoles, getPosts } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

const STATIC_PAGES = ["", "/services/", "/journey/", "/gallery/", "/recruitment/", "/stories/", "/blog/", "/about/", "/contact/", "/privacy/"];

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [roles, topics, posts] = await Promise.all([getOpenRoles(), getBlogTopics(), getPosts()]);
  const now = new Date();
  const checked = (p: (typeof posts)[number]) => p.reviewedAt || p.publishedAt;

  return [
    ...STATIC_PAGES.map((path) => ({
      url: `${siteUrl}${path || "/"}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...roles.map((role) => ({
      url: `${siteUrl}/recruitment/${role.slug}/`,
      lastModified: day(role.datePosted),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    // Topic pages with at least one post (an empty topic page is kept out of search).
    ...topics
      .map((topic) => ({ topic, dates: posts.filter((p) => p.topic?.slug === topic.slug).map(checked).filter(Boolean) as string[] }))
      .filter(({ dates }) => dates.length > 0)
      .map(({ topic, dates }) => ({
        url: `${siteUrl}${topicPath(topic.slug)}`,
        lastModified: day(dates.sort().at(-1)!),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ...posts.map((post) => ({
      url: `${siteUrl}${postPath(post.slug)}`,
      ...(checked(post) ? { lastModified: day(checked(post)!) } : {}),
      changeFrequency: "monthly" as const,
      priority: post.pillar ? 0.8 : 0.7,
    })),
  ];
}
