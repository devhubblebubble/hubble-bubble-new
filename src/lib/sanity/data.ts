import { cache } from "react";
import { sanityClient } from "./client";
import { offline } from "./env";
import { fixtureRoles, fixtureSettings } from "./fixture";
import { openRolesQuery, siteSettingsQuery } from "./queries";
import type { JobRole, SiteSettings } from "./types";

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Hubble Bubble",
  contactEmail: "info@hubblebubble.club",
};

const today = () => new Date().toISOString().slice(0, 10);

const isLive = (role: JobRole) =>
  role.status === "open" && (!role.closingDate || role.closingDate >= today());

/** Open, unexpired roles, sorted by country then newest first. */
export const getOpenRoles = cache(async (): Promise<JobRole[]> => {
  if (offline) {
    console.log("[sanity] SANITY_OFFLINE=1: using content/seed/job-roles.json");
    return fixtureRoles().filter(isLive);
  }
  const roles = await sanityClient.fetch<JobRole[]>(openRolesQuery, {
    today: today(),
  });
  return roles.filter(isLive);
});

export const getRoleBySlug = cache(
  async (slug: string): Promise<JobRole | undefined> => {
    const roles = await getOpenRoles();
    return roles.find((r) => r.slug === slug);
  },
);

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (offline) return { ...DEFAULT_SETTINGS, ...fixtureSettings() };
  const settings =
    await sanityClient.fetch<SiteSettings | null>(siteSettingsQuery);
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
});
