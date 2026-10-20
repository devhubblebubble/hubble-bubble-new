import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import AboutUsPage from "@/components/AboutUs/AboutUsPage";
import FooterSection from "@/components/FooterSection/FooterSection";
import { getAboutPage, getSiteSettings } from "@/lib/sanity/data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage();
  return {
    title: page.seoTitle ?? "About Us | Hubble Bubble",
    description:
      page.seoDescription ??
      "We didn't start this to send students abroad. Meet the team, read our story, and understand why we exist.",
    alternates: { canonical: "/about/" },
  };
}

export default async function AboutPageRoute() {
  const [page, settings] = await Promise.all([getAboutPage(), getSiteSettings()]);

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <AboutUsPage data={page} settings={settings} />
      <FooterSection />
    </main>
  );
}
