import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import BlogIndex from "@/components/Blog/BlogIndex";
import { getBlogTopics, getPosts } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

const title = "Study abroad guides for international students | Hubble Bubble";
const description =
  "Free guides for international students on choosing a course, applying, visas, costs and agents. Plain English, checked against official sources.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${siteUrl}/blog/` },
  openGraph: { title, description, url: `${siteUrl}/blog/`, type: "website" },
};

export default async function BlogRoute() {
  const [topics, posts] = await Promise.all([getBlogTopics(), getPosts()]);

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <BlogIndex topics={topics} posts={posts} />
      <FooterSection />
    </main>
  );
}
