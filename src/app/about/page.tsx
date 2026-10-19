import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import AboutUsPage from "@/components/AboutUs/AboutUsPage";
import FooterSection from "@/components/FooterSection/FooterSection";

export const metadata: Metadata = {
  title: "About Us | Hubble Bubble",
  description:
    "We didn't start this to send students abroad. Meet the team, read our story, and understand why we exist.",
  alternates: { canonical: "/about/" },
};

export default function AboutPageRoute() {
  return (
    <main>
      <NavBar />
      <AboutUsPage />
      <FooterSection />
    </main>
  );
}
