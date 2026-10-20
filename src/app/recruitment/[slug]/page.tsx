import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar/NavBar";
import FooterSection from "@/components/FooterSection/FooterSection";
import JobRolePage from "@/components/JobRolePage/JobRolePage";
import { getOpenRoles, getRoleBySlug, getSiteSettings } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

type Params = { slug: string };

// Static export: one HTML page per open role, nothing else.
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Params[]> {
  const roles = await getOpenRoles();
  return roles.map((role) => ({ slug: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const role = await getRoleBySlug(slug);
  if (!role) return {};

  const title = role.seoTitle || `${role.title} in ${role.country} | Hubble Bubble`;
  const description = role.seoDescription || role.summary;
  const url = `${siteUrl}/recruitment/${role.slug}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function JobRoleRoute({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const [role, settings] = await Promise.all([getRoleBySlug(slug), getSiteSettings()]);
  if (!role) notFound();

  return (
    <main id="main" tabIndex={-1}>
      <NavBar />
      <JobRolePage role={role} settings={settings} />
      <FooterSection />
    </main>
  );
}
