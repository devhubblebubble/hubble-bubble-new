import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import RecruitmentPage from "@/components/RecruitmentPage/RecruitmentPage";
import { recruitmentPageCopy } from "@/components/RecruitmentPage/recruitmentPage.data";
import { getOpenRoles, getSiteSettings } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: recruitmentPageCopy.metaTitle,
  description: recruitmentPageCopy.metaDescription,
  alternates: { canonical: `${siteUrl}/recruitment/` },
};

export default async function RecruitmentRoute() {
  const [roles, settings] = await Promise.all([getOpenRoles(), getSiteSettings()]);

  return (
    <main>
      <NavBar />
      <RecruitmentPage roles={roles} settings={settings} />
      <FooterSection />
    </main>
  );
}
