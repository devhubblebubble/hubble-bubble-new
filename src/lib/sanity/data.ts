import { cache } from "react";
import { tidyHubs } from "@/lib/blog/hubs.mjs";
import { sanityClient } from "./client";
import { offline } from "./env";
import {
  fixtureAboutPage,
  fixtureBlogDestinations,
  fixtureBlogOrigins,
  fixtureBlogTopics,
  fixtureContactPage,
  fixtureHomePage,
  fixturePosts,
  fixturePrivacyPage,
  fixtureRecruitmentPage,
  fixtureRoles,
  fixtureServicesPage,
  fixtureSettings,
  fixtureStories,
  fixtureStoriesPage,
  fixtureTeam,
} from "./fixture";
import {
  aboutPageQuery,
  blogDestinationsQuery,
  blogOriginsQuery,
  blogTopicsQuery,
  contactPageQuery,
  homePageQuery,
  openRolesQuery,
  postsQuery,
  privacyPageQuery,
  recruitmentPageQuery,
  servicesPageQuery,
  siteSettingsQuery,
  storiesPageQuery,
  storiesQuery,
  teamMembersQuery,
} from "./queries";
import type {
  AboutPage,
  BlogDestination,
  BlogOrigin,
  BlogTopic,
  ContactPage,
  HomePage,
  JobRole,
  Post,
  PostLink,
  PrivacyPage,
  RecruitmentPage,
  ServicesPage,
  SiteSettings,
  StoriesPage,
  Story,
  TeamMember,
} from "./types";

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Hubble Bubble",
  contactEmail: "hello@hubblebubble.club",
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

export const getContactPage = cache(async (): Promise<ContactPage> =>
  (await fetchOr<ContactPage | null>(contactPageQuery, fixtureContactPage)) ?? {},
);

export const getRecruitmentPage = cache(async (): Promise<RecruitmentPage> =>
  (await fetchOr<RecruitmentPage | null>(recruitmentPageQuery, fixtureRecruitmentPage)) ?? {},
);

// ── Blog ───────────────────────────────────────────────────────────────────

/** Blog topics in their order on /blog/. */
export const getBlogTopics = cache(async (): Promise<BlogTopic[]> =>
  ((await fetchOr<BlogTopic[] | null>(blogTopicsQuery, fixtureBlogTopics)) ?? []).filter((t) => t.slug),
);

/**
 * Every visible post: main guides first, then the most recently checked.
 * Links to deleted or hidden posts are dropped from "Read next".
 */
export const getPosts = cache(async (): Promise<Post[]> => {
  const posts = (await fetchOr<Post[] | null>(postsQuery, fixturePosts)) ?? [];
  return posts
    .filter((p) => p.slug && p.title)
    .map((p) => ({
      ...p,
      related: (p.related ?? []).filter((r): r is PostLink => Boolean(r && r.slug && !r.hidden && r.slug !== p.slug)),
      origins: (p.origins ?? []).filter((o): o is string => Boolean(o)),
    }));
});

export const getPostBySlug = cache(async (slug: string): Promise<Post | undefined> =>
  (await getPosts()).find((p) => p.slug === slug),
);

export const getPostsByTopic = cache(async (topicSlug: string): Promise<Post[]> =>
  (await getPosts()).filter((p) => p.topic?.slug === topicSlug),
);

export type BlogHubs = {
  /** Study in pages, in their order on /blog/. */
  destinations: BlogDestination[];
  /** Students from pages, in their order on /blog/. */
  origins: BlogOrigin[];
  /** Post slug -> hub address, for every post that is a hub's main guide. */
  guides: Map<string, string>;
};

/**
 * The Study in and Students from pages, checked against the visible posts (a
 * main guide or listed post that is missing or hidden is dropped), and the
 * guide map every link to a post goes through (see src/lib/blog/urls.mjs).
 */
export const getBlogHubs = cache(async (): Promise<BlogHubs> => {
  const [destinations, origins, posts] = await Promise.all([
    fetchOr<BlogDestination[] | null>(blogDestinationsQuery, fixtureBlogDestinations),
    fetchOr<BlogOrigin[] | null>(blogOriginsQuery, fixtureBlogOrigins),
    getPosts(),
  ]);
  return tidyHubs(
    (destinations ?? []).filter((d) => d.slug && d.name),
    (origins ?? []).filter((o) => o.slug && o.name),
    posts.map((p) => p.slug),
  );
});
