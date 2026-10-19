import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import PrivacyPage from "@/components/PrivacyPage/PrivacyPage";
import FooterSection from "@/components/FooterSection/FooterSection";

export const metadata: Metadata = {
  title: "Privacy Policy | Hubble Bubble",
  description:
    "How Hubble Bubble collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPageRoute() {
  return (
    <main>
      <NavBar />
      <PrivacyPage />
      <FooterSection />
    </main>
  );
}
