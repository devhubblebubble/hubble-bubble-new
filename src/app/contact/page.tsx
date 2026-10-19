import { Suspense } from "react";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import ContactPage from "@/components/ContactPage/ContactPage";
import FooterSection from "@/components/FooterSection/FooterSection";
import { getSiteSettings } from "@/lib/sanity/data";

export const metadata: Metadata = {
  title: "Contact Us | Hubble Bubble",
  description:
    "Get in touch with Hubble Bubble. Whether you're a student, a partner, or just curious, we'd love to hear from you.",
  alternates: { canonical: "/contact/" },
};

export default async function ContactPageRoute() {
  const settings = await getSiteSettings();

  return (
    <main>
      <NavBar />
      <Suspense fallback={null}>
        <ContactPage settings={settings} />
      </Suspense>
      <FooterSection />
    </main>
  );
}
