import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import BlogTopicPage from "@/components/Blog/BlogTopicPage";
import { topicPath } from "@/lib/blog/jsonld";
import { getBlogHubs, getBlogTopics, getPosts, getPostsByTopic } from "@/lib/sanity/data";
import { noIndex, siteUrl } from "@/lib/site";

type Params = { topic: string };

export const dynamicParams = false;

// See the note in /blog/[slug]: one placeholder when there are no topics.
const PLACEHOLDER = "_no-topics-yet";

export async function generateStaticParams(): Promise<Params[]> {
  const topics = await getBlogTopics();
  return topics.length ? topics.map((t) => ({ topic: t.slug })) : [{ topic: PLACEHOLDER }];
}

const findTopic = async (slug: string) => (await getBlogTopics()).find((t) => t.slug === slug);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { topic: slug } = await params;
  const [topic, posts] = await Promise.all([findTopic(slug), getPostsByTopic(slug)]);
  if (!topic) return {};

  const title = topic.seoTitle || `${topic.title}: study abroad guides | Hubble Bubble`;
  const description = topic.seoDescription || topic.description;
  const url = `${siteUrl}${topicPath(topic.slug)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    // A topic with no posts yet is an empty page: keep it out of search results.
    ...(posts.length === 0 ? { robots: { index: false, follow: !noIndex } } : {}),
  };
}

export default async function BlogTopicRoute({ params }: { params: Promise<Params> }) {
  const { topic: slug } = await params;
  const [topic, topics, posts, allPosts, { guides }] = await Promise.all([
    findTopic(slug),
    getBlogTopics(),
    getPostsByTopic(slug),
    getPosts(),
    getBlogHubs(),
  ]);
  if (!topic) notFound();
  // "Other topics" only lists topics that have posts.
  const withPosts = topics.filter((t) => allPosts.some((p) => p.topic?.slug === t.slug));

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <BlogTopicPage topic={topic} posts={posts} topics={withPosts} guides={guides} />
      <FooterSection />
    </main>
  );
}
