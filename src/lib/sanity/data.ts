import { cache } from "react";
import { sanityClient } from "./client";
import { offline } from "./env";
import {
  fixtureAboutPage,
  fixtureHomePage,
  fixturePrivacyPage,
  fixtureRoles,
  fixtureServicesPage,
  fixtureSettings,
  fixtureStories,
  fixtureStoriesPage,
  fixtureTeam,
} from "./fixture";
import {
  aboutPageQuery,
  homePageQuery,
  openRolesQuery,
  privacyPageQuery,
  servicesPageQuery,
  siteSettingsQuery,
  storiesPageQuery,
  storiesQuery,
  teamMembersQuery,
} from "./queries";
import type {
  AboutPage,
  HomePage,
  JobRole,
  PrivacyPage,
  ServicesPage,
  SiteSettings,
  StoriesPage,
  Story,
  TeamMember,
} from "./types";

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Hubble Bubble",
  contactEmail: "hello@hubblebubble.uk",
};

const today = () => new Date().toISOString().slice(0, 10);

const isLive = (role: JobRole) =>
  role.status === "open" && (!role.closingDate || role.closingDate >= today());

let loggedOffline = false;
const fetchOr = async <T>(query: string, fixture: () => T, params: Record<string, unknown> = {}): Promise<T> => {
  if (offline) {
    if (!loggedOffline) {
      console.log("[sanity] SANITY_OFFLINE=1: building from content/seed/*.json");
      loggedOffline = true;
    }
    return fixture();
  }
  return sanityClient.fetch<T>(query, params);
};

/** Open, unexpired roles, sorted by country then newest first. */
export const getOpenRoles = cache(async (): Promise<JobRole[]> => {
  const roles = await fetchOr<JobRole[]>(openRolesQuery, fixtureRoles, { today: today() });
  return roles.filter(isLive);
});

export const getRoleBySlug = cache(async (slug: string): Promise<JobRole | undefined> => {
  const roles = await getOpenRoles();
  return roles.find((r) => r.slug === slug);
});

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const settings = await fetchOr<SiteSettings | null>(siteSettingsQuery, fixtureSettings);
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
});

export const getStories = cache(async (): Promise<Story[]> =>
  (await fetchOr<Story[] | null>(storiesQuery, fixtureStories)) ?? [],
);

export const getTeamMembers = cache(async (): Promise<TeamMember[]> =>
  (await fetchOr<TeamMember[] | null>(teamMembersQuery, fixtureTeam)) ?? [],
);

export const getHomePage = cache(async (): Promise<HomePage> => {
  const page = (await fetchOr<HomePage | null>(homePageQuery, fixtureHomePage)) ?? {};
  // Dropped references come back as null; fall back to the first two stories.
  const featured = (page.featuredStories ?? []).filter(Boolean);
  return { ...page, featuredStories: featured.length ? featured : (await getStories()).slice(0, 2) };
});

export const getAboutPage = cache(async (): Promise<AboutPage> => {
  const page = (await fetchOr<AboutPage | null>(aboutPageQuery, fixtureAboutPage)) ?? {};
  const team = (page.team ?? []).filter(Boolean);
  return { ...page, team: team.length ? team : await getTeamMembers() };
});

export const getServicesPage = cache(async (): Promise<ServicesPage> =>
  (await fetchOr<ServicesPage | null>(servicesPageQuery, fixtureServicesPage)) ?? {},
);

export const getStoriesPage = cache(async (): Promise<StoriesPage> =>
  (await fetchOr<StoriesPage | null>(storiesPageQuery, fixtureStoriesPage)) ?? {},
);

export const getPrivacyPage = cache(async (): Promise<PrivacyPage> =>
  (await fetchOr<PrivacyPage | null>(privacyPageQuery, fixturePrivacyPage)) ?? {},
);
