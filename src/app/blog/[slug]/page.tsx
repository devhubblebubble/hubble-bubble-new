import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import BlogPostPage from "@/components/Blog/BlogPostPage";
import { postPath } from "@/lib/blog/jsonld";
import { getPostBySlug, getPosts, getSiteSettings } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

type Params = { slug: string };

// Static export: one HTML page per post, nothing else.
export const dynamicParams = false;

// A static export refuses an empty list, so with no posts yet one placeholder
// address is built, and it shows the "page not found" page.
const PLACEHOLDER = "_no-posts-yet";

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await getPosts();
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.seoTitle || `${post.title} | Hubble Bubble`;
  const description = post.description || post.excerpt;
  const url = `${siteUrl}${postPath(post.slug)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(post.reviewedAt ? { modifiedTime: post.reviewedAt } : {}),
      ...(post.topic?.title ? { section: post.topic.title } : {}),
    },
  };
}

export default async function BlogPostRoute({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getPostBySlug(slug), getSiteSettings()]);
  if (!post) notFound();

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <BlogPostPage post={post} settings={settings} />
      <FooterSection />
    </main>
  );
}
