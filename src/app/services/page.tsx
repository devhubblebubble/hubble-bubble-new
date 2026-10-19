import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import ServicesPage from "@/components/ServicesPage/ServicesPage";
import FooterSection from "@/components/FooterSection/FooterSection";

export const metadata: Metadata = {
  title: "Services | Hubble Bubble",
  description:
    "Explore what Hubble Bubble offers — from career mapping and university applications to visa guidance and scholarship support.",
  alternates: { canonical: "/services/" },
};

export default function ServicesRoute() {
  return (
    <main>
      <NavBar />
      <ServicesPage />
      <FooterSection />
    </main>
  );
}
