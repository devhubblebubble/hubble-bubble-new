import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import BlogIndex from "@/components/Blog/BlogIndex";
import { getBlogHubs, getBlogTopics, getPosts } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

const title = "Study abroad guides for international students | Hubble Bubble";
const description =
  "Free guides for international students: country guides, advice for your home country, applying, visas, costs and agents. Checked against official sources.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${siteUrl}/blog/` },
  openGraph: { title, description, url: `${siteUrl}/blog/`, type: "website" },
};

export default async function BlogRoute() {
  const [topics, posts, hubs] = await Promise.all([getBlogTopics(), getPosts(), getBlogHubs()]);

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <BlogIndex
        topics={topics}
        posts={posts}
        destinations={hubs.destinations}
        origins={hubs.origins}
        guides={hubs.guides}
      />
      <FooterSection />
    </main>
  );
}
