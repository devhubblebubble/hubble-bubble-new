import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import BlogHubPage from "@/components/Blog/BlogHubPage";
import { hubMetadata, loadHub } from "@/lib/blog/hubView";
import { getBlogHubs, getSiteSettings } from "@/lib/sanity/data";

// /blog/study-in/<destination>/: a study destination's page: the main guide in full, then more
// posts. Edited in the Studio under Blog, Study destinations.
type Params = { country: string };

export const dynamicParams = false;

// See the note in /blog/[slug]: one placeholder when there are none yet.
const PLACEHOLDER = "_no-destinations-yet";

export async function generateStaticParams(): Promise<Params[]> {
  const { destinations } = await getBlogHubs();
  return destinations.length ? destinations.map((h) => ({ country: h.slug })) : [{ country: PLACEHOLDER }];
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country } = await params;
  const view = await loadHub("destination", country);
  return view ? hubMetadata(view) : {};
}

export default async function StudyInRoute({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const [view, settings] = await Promise.all([loadHub("destination", country), getSiteSettings()]);
  if (!view) notFound();

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <BlogHubPage view={view} settings={settings} />
      <FooterSection />
    </main>
  );
}
