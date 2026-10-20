import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import PrivacyPage from "@/components/PrivacyPage/PrivacyPage";
import FooterSection from "@/components/FooterSection/FooterSection";
import { getPrivacyPage } from "@/lib/sanity/data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPrivacyPage();
  return {
    title: page.seoTitle ?? "Privacy Policy | Hubble Bubble",
    description:
      page.seoDescription ??
      "How Hubble Bubble collects, uses, and protects your personal information.",
    alternates: { canonical: "/privacy/" },
  };
}

export default async function PrivacyPageRoute() {
  const page = await getPrivacyPage();

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <PrivacyPage data={page} />
      <FooterSection />
    </main>
  );
}
