import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import OrganizationJsonLd from "@/components/StructuredData/OrganizationJsonLd";
import HeroSection from "@/components/HeroSection/HeroSection";
import WorldMapSection from "@/components/WorldMapSection/WorldMapSection";
import PartnerCardsSection from "@/components/PartnerCardsSection/PartnerCardsSection";
import StoriesSection from "@/components/StoriesSection/StoriesSection";
import JourneySection from "@/components/JourneySection/JourneySection";
import TestimonialsSection from "@/components/TestimonialsSection/TestimonialsSection";
import GallerySection from "@/components/GallerySection/GallerySection";
import OriginSection from "@/components/OriginSection/OriginSection";
import CtaSection from "@/components/CtaSection/CtaSection";
import FooterSection from "@/components/FooterSection/FooterSection";
import { getHomePage, getSiteSettings } from "@/lib/sanity/data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomePage();
  return {
    ...(page.seoTitle ? { title: page.seoTitle } : {}),
    ...(page.seoDescription ? { description: page.seoDescription } : {}),
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  const [page, settings] = await Promise.all([getHomePage(), getSiteSettings()]);

  return (
    <main id="main" tabIndex={-1}>
      <OrganizationJsonLd />
      <NavBar />
      <HeroSection data={page} settings={settings} />
      <WorldMapSection headline={page.worldMapHeadline} />
      <PartnerCardsSection data={page} />
      <StoriesSection
        title={page.storiesTitle}
        viewAllLabel={page.storiesViewAllLabel}
        stories={page.featuredStories ?? []}
      />
      <JourneySection steps={page.journeySteps} outputsLabel={page.journeyOutputsLabel} />
      <TestimonialsSection
        title={page.testimonialsTitle}
        lead={page.testimonialsLead}
        testimonials={page.testimonials}
      />
      {page.galleryItems && page.galleryItems.length > 0 && (
        <GallerySection
          title={page.galleryTitle}
          lead={page.galleryLead}
          hint={page.galleryHint}
          items={page.galleryItems}
        />
      )}
      <OriginSection data={page} />
      <CtaSection data={page} settings={settings} />
      <FooterSection />
    </main>
  );
}
