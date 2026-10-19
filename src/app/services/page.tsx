import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import ServicesPage from "@/components/ServicesPage/ServicesPage";
import FooterSection from "@/components/FooterSection/FooterSection";
import { getServicesPage } from "@/lib/sanity/data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getServicesPage();
  return {
    title: page.seoTitle ?? "Services | Hubble Bubble",
    description:
      page.seoDescription ??
      "Explore what Hubble Bubble offers, from career mapping and university applications to visa guidance and scholarship support.",
    alternates: { canonical: "/services/" },
  };
}

export default async function ServicesRoute() {
  const page = await getServicesPage();

  return (
    <main>
      <NavBar />
      <ServicesPage data={page} />
      <FooterSection />
    </main>
  );
}
