import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import BlogPostPage from "@/components/Blog/BlogPostPage";
import { postPath } from "@/lib/blog/jsonld";
import { getBlogHubs, getPostBySlug, getPosts, getSiteSettings } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

type Params = { slug: string };

// Static export: one HTML page per post, nothing else. A post that is the main
// guide of a Study in or Students from page has no page here: it is shown in
// full on that page, and its old address redirects there (see src/app/%5Fredirects).
export const dynamicParams = false;

// A static export refuses an empty list, so with no posts yet one placeholder
// address is built, and it shows the "page not found" page.
const PLACEHOLDER = "_no-posts-yet";

export async function generateStaticParams(): Promise<Params[]> {
  const [posts, { guides }] = await Promise.all([getPosts(), getBlogHubs()]);
  const own = posts.filter((p) => !guides.has(p.slug));
  return own.length ? own.map((p) => ({ slug: p.slug })) : [{ slug: PLACEHOLDER }];
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
  const [post, settings, { guides }] = await Promise.all([getPostBySlug(slug), getSiteSettings(), getBlogHubs()]);
  if (!post || guides.has(post.slug)) notFound();

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <BlogPostPage post={post} settings={settings} guides={guides} />
      <FooterSection />
    </main>
  );
}
