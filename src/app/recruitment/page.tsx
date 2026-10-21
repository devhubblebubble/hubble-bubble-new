import type { Metadata } from "next";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import RecruitmentPage from "@/components/RecruitmentPage/RecruitmentPage";
import { recruitmentPageCopy } from "@/components/RecruitmentPage/recruitmentPage.data";
import { withDefaults } from "@/lib/content";
import { getOpenRoles, getRecruitmentPage, getSiteSettings } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

const getCopy = async () => withDefaults(recruitmentPageCopy, await getRecruitmentPage());

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getCopy();
  return {
    title: copy.seoTitle,
    description: copy.seoDescription,
    alternates: { canonical: `${siteUrl}/recruitment/` },
  };
}

export default async function RecruitmentRoute() {
  const [roles, settings, copy] = await Promise.all([getOpenRoles(), getSiteSettings(), getCopy()]);

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <RecruitmentPage roles={roles} settings={settings} copy={copy} />
      <FooterSection />
    </main>
  );
}
