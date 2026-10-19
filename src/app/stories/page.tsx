import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import StoriesPage from "@/components/StoriesPage/StoriesPage";
import FooterSection from "@/components/FooterSection/FooterSection";
import { getStories, getStoriesPage } from "@/lib/sanity/data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getStoriesPage();
  return {
    title: page.seoTitle ?? "Student Stories | Hubble Bubble",
    description:
      page.seoDescription ??
      "Real students. Real journeys. Read how Hubble Bubble helped them find their path and land where they truly belong.",
    alternates: { canonical: "/stories/" },
  };
}

export default async function StoriesPageRoute() {
  const [page, stories] = await Promise.all([getStoriesPage(), getStories()]);

  return (
    <main>
      <NavBar />
      <StoriesPage title={page.title} stories={stories} />
      <FooterSection />
    </main>
  );
}
