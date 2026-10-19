import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import OrganizationJsonLd from "@/components/StructuredData/OrganizationJsonLd";
import HeroSection from "@/components/HeroSection/HeroSection";
import WorldMapSection from "@/components/WorldMapSection/WorldMapSection";
import PartnerCardsSection from "@/components/PartnerCardsSection/PartnerCardsSection";
import StoriesSection from "@/components/StoriesSection/StoriesSection";
import JourneySection from "@/components/JourneySection/JourneySection";
import TestimonialsSection from "@/components/TestimonialsSection/TestimonialsSection";
import OriginSection from "@/components/OriginSection/OriginSection";
import CtaSection from "@/components/CtaSection/CtaSection";
import FooterSection from "@/components/FooterSection/FooterSection";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <main>
      <OrganizationJsonLd />
      <NavBar />
      <HeroSection />
      <WorldMapSection />
      <PartnerCardsSection />
      <StoriesSection />
      <JourneySection />
      <TestimonialsSection />
      <OriginSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
