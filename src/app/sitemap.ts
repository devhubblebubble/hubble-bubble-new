import type { MetadataRoute } from "next";
import { getOpenRoles } from "@/lib/sanity/data";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

const STATIC_PAGES = ["", "/services/", "/journey/", "/gallery/", "/recruitment/", "/stories/", "/about/", "/contact/", "/privacy/"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const roles = await getOpenRoles();
  const now = new Date();

  return [
    ...STATIC_PAGES.map((path) => ({
      url: `${siteUrl}${path || "/"}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...roles.map((role) => ({
      url: `${siteUrl}/recruitment/${role.slug}/`,
      lastModified: new Date(`${role.datePosted}T00:00:00Z`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
