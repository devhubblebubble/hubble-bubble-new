import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import ContactPage from "@/components/ContactPage/ContactPage";
import FooterSection from "@/components/FooterSection/FooterSection";
import { contactPageDefaults } from "@/components/ContactPage/contactPage.data";
import { withDefaults } from "@/lib/content";
import { getContactPage, getSiteSettings } from "@/lib/sanity/data";

const getCopy = async () => withDefaults(contactPageDefaults, await getContactPage());

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy.seoTitle,
    description: copy.seoDescription,
    alternates: { canonical: "/contact/" },
  };
}

export default async function ContactPageRoute() {
  const [settings, copy] = await Promise.all([getSiteSettings(), getCopy()]);

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <ContactPage settings={settings} copy={copy} />
      <FooterSection />
    </main>
  );
}
