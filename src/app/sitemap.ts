import type { MetadataRoute } from "next";
import { isReady } from "@/lib/blog/hubs.mjs";
import { destinationPath, originPath, postPath, topicPath } from "@/lib/blog/urls.mjs";
import { getBlogHubs, getBlogTopics, getOpenRoles, getPosts } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

const STATIC_PAGES = ["", "/services/", "/journey/", "/gallery/", "/recruitment/", "/stories/", "/blog/", "/about/", "/contact/", "/privacy/"];

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [roles, topics, posts, hubs] = await Promise.all([getOpenRoles(), getBlogTopics(), getPosts(), getBlogHubs()]);
  const now = new Date();
  const checked = (p: (typeof posts)[number]) => p.reviewedAt || p.publishedAt;
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  // Study in and Students from pages with their main guide (one without is kept
  // out of search). Dated by the guide's "Last checked".
  const hubPages = [
    ...hubs.destinations.filter(isReady).map((h) => ({ path: destinationPath(h.slug), guide: h.guideSlug })),
    ...hubs.origins.filter(isReady).map((h) => ({ path: originPath(h.slug), guide: h.guideSlug })),
  ].map(({ path, guide }) => {
    const post = guide ? bySlug.get(guide) : undefined;
    return { path, date: post ? checked(post) : undefined };
  });

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
    ...hubPages.map(({ path, date }) => ({
      url: `${siteUrl}${path}`,
      ...(date ? { lastModified: day(date) } : {}),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Posts, except the hubs' main guides: they live at the hub's address.
    ...posts.filter((post) => !hubs.guides.has(post.slug)).map((post) => ({
      url: `${siteUrl}${postPath(post.slug)}`,
      ...(checked(post) ? { lastModified: day(checked(post)!) } : {}),
      changeFrequency: "monthly" as const,
      priority: post.pillar ? 0.8 : 0.7,
    })),
  ];
}
