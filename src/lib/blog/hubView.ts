// Everything a Study in or Students from page needs, for its route
// (src/app/blog/study-in/[country] and src/app/blog/students-from/[country]).
import type { Metadata } from "next";
import { getBlogHubs, getBlogTopics, getPosts } from "@/lib/sanity/data";
import type { BlogDestination, BlogOrigin, Post } from "@/lib/sanity/types";
import { noIndex, siteUrl } from "@/lib/site";
import { destinationPosts, destinationsFor, hubLabel, originPosts, originsFor } from "./hubs.mjs";
import { destinationPath, originPath } from "./urls.mjs";

export type HubKind = "destination" | "origin";

export type HubView = {
  kind: HubKind;
  hub: BlogDestination | BlogOrigin;
  /** "Study in the UK", "Students from Nigeria". */
  label: string;
  path: string;
  /** The main guide, shown in full. Without one the page is a short list, kept out of search. */
  guide?: Post;
  /** More posts, listed after the guide. */
  posts: Post[];
  listTitle: string;
  /** Hubs of the other kind this page links to. */
  links: { path: string; name: string; flag?: string }[];
  linksTitle: string;
  linksLead: string;
  /** The topic shown in the breadcrumb (the guide's own topic when there is a guide). */
  topic: { title: string; slug: string } | null;
  guides: Map<string, string>;
};

// The topic each kind of page sits under in the breadcrumb when it has no guide.
const TOPIC: Record<HubKind, string> = { destination: "destinations", origin: "home-country" };

export async function loadHub(kind: HubKind, slug: string): Promise<HubView | undefined> {
  const [{ destinations, origins, guides }, posts, topics] = await Promise.all([
    getBlogHubs(),
    getPosts(),
    getBlogTopics(),
  ]);
  const hub = (kind === "destination" ? destinations : origins).find((h) => h.slug === slug);
  if (!hub) return undefined;

  const inSentence = hub.nameInSentence?.trim() || hub.name;
  const guide = hub.guideSlug ? posts.find((p) => p.slug === hub.guideSlug) : undefined;
  const fallbackTopic = topics.find((t) => t.slug === TOPIC[kind]);
  const destination = kind === "destination";

  return {
    kind,
    hub,
    label: hubLabel(kind, hub),
    path: destination ? destinationPath(hub.slug) : originPath(hub.slug),
    guide,
    posts: destination ? destinationPosts(hub, posts) : originPosts(hub, posts),
    listTitle: destination
      ? guide
        ? `More on studying in ${inSentence}`
        : `Guides for studying in ${inSentence}`
      : guide
        ? `More for students from ${inSentence}`
        : `Guides for students from ${inSentence}`,
    links: destination
      ? originsFor(hub, origins, posts).map((o) => ({ path: originPath(o.slug), name: o.name, flag: o.flag }))
      : destinationsFor(hub, destinations, posts).map((d) => ({ path: destinationPath(d.slug), name: d.name, flag: d.flag })),
    linksTitle: destination ? "Rules for your nationality" : "Where you could study",
    linksLead: destination
      ? "Some visa steps, documents and money rules depend on where you are from. Pick your country."
      : "Each guide covers visas, costs, applying and work after study.",
    topic: guide?.topic ?? (fallbackTopic ? { title: fallbackTopic.title, slug: fallbackTopic.slug } : null),
    guides,
  };
}

export function hubMetadata({ guide, hub, label, path }: HubView): Metadata {
  const title = guide ? guide.seoTitle || `${guide.title} | Hubble Bubble` : `${label}: study abroad guides | Hubble Bubble`;
  const description = (guide && (guide.description || guide.excerpt)) || hub.intro;
  const url = `${siteUrl}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: guide ? "article" : "website",
      ...(guide?.publishedAt ? { publishedTime: guide.publishedAt } : {}),
      ...(guide?.reviewedAt ? { modifiedTime: guide.reviewedAt } : {}),
      ...(guide?.topic?.title ? { section: guide.topic.title } : {}),
    },
    // Without its main guide the page is only a short list: keep it out of search results.
    ...(guide ? {} : { robots: { index: false, follow: !noIndex } }),
  };
}
