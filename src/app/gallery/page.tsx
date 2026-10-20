import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import GallerySection from "@/components/GallerySection/GallerySection";
import { getHomePage } from "@/lib/sanity/data";

// The Gallery ("Look who've noticed us") as a screen of its own. On phones the
// bottom bar's Gallery tab opens it, so the bubbles get the whole screen. The
// same bubbles also sit on the home page, between the testimonials and the
// origin story.

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomePage();
  const names = (page.galleryItems ?? []).map((item) => item.name).filter(Boolean);
  return {
    title: `${page.galleryTitle ?? "Look who've noticed us"} | Hubble Bubble`,
    description:
      page.galleryLead ?? `The stories behind the names in Hubble Bubble's gallery: ${names.join(", ")}.`,
    alternates: { canonical: "/gallery/" },
  };
}

export default async function GalleryRoute() {
  const page = await getHomePage();
  if (!page.galleryItems?.length) notFound();

  return (
    <main>
      <NavBar />
      <GallerySection
        variant="page"
        title={page.galleryTitle}
        lead={page.galleryLead}
        hint={page.galleryHint}
        items={page.galleryItems}
      />
    </main>
  );
}
