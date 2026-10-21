// Offline content for test builds (SANITY_OFFLINE=1): the same JSON files the
// import script loads into Sanity, converted to the shape the live queries
// return (markup -> Portable Text, images -> local /public paths with sizes,
// references -> the referenced documents).
import { readFileSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import type { PortableTextBlock } from "@portabletext/types";
import { postsDir, readPostDocuments } from "../../../content/seed/blog.mjs";
import { convertMarkupFields } from "../../../content/seed/markup.mjs";
import type {
  AboutPage,
  BlogTopic,
  ContactPage,
  HomePage,
  JobRole,
  Post,
  PostBody,
  PostLink,
  PrivacyPage,
  RecruitmentPage,
  ServicesPage,
  SiteSettings,
  StoriesPage,
  Story,
  TeamMember,
  University,
} from "./types";

const root = process.cwd();
const seedDir = path.join(root, "content", "seed");

const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(path.join(seedDir, file), "utf8")) as T;

const toBlocks = (paragraphs: string[] = []): PortableTextBlock[] =>
  paragraphs.map((text, i) => ({
    _type: "block",
    _key: `p${i + 1}`,
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: `s${i + 1}`, text, marks: [] }],
  }));

type Json = unknown;

/** {_upload: "public/images/x.png"} -> {_localSrc: "/images/x.png", width, height}. */
function localiseImages(value: Json): Json {
  if (Array.isArray(value)) return value.map(localiseImages);
  if (value && typeof value === "object") {
    const obj = value as Record<string, Json>;
    if (typeof obj._upload === "string") {
      const rel = obj._upload;
      let dims: { width?: number; height?: number } = {};
      try {
        dims = imageSize(readFileSync(path.join(root, rel)));
      } catch {
        // size unknown; components fall back to their defaults
      }
      const { _upload, ...rest } = obj;
      void _upload;
      return {
        _type: "image",
        _localSrc: "/" + rel.replace(/^public\//, ""),
        width: dims.width,
        height: dims.height,
        ...rest,
      };
    }
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, localiseImages(v)]));
  }
  return value;
}

/** Give array objects a _key, like the import script does. */
function withKeys(value: Json, prefix = "k"): Json {
  if (Array.isArray(value)) {
    return value.map((v, i) =>
      v && typeof v === "object" && !Array.isArray(v)
        ? { _key: `${prefix}${i + 1}`, ...(withKeys(v, `${prefix}${i + 1}`) as object) }
        : withKeys(v, `${prefix}${i + 1}`),
    );
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, Json>).map(([k, v]) => [k, withKeys(v, `${prefix}${k.slice(0, 3)}`)]),
    );
  }
  return value;
}

const prepare = <T>(doc: Json): T => withKeys(localiseImages(convertMarkupFields(doc))) as T;

type Ref = { _type: "reference"; _ref: string };
const deref = <T extends { _id: string }>(refs: Ref[] | undefined, docs: T[]): T[] =>
  (refs ?? []).map((r) => docs.find((d) => d._id === r._ref)).filter((d): d is T => Boolean(d));

export function fixtureRoles(): JobRole[] {
  type SeedRole = Omit<JobRole, "about" | "closingDate"> & { about?: string[]; closingDate?: string | null };
  return readJson<SeedRole[]>("job-roles.json").map((r) => ({
    ...r,
    about: toBlocks(r.about),
    closingDate: r.closingDate ?? undefined,
  }));
}

export const fixtureSettings = (): SiteSettings => readJson<SiteSettings>("site-settings.json");

export const fixtureStories = (): Story[] =>
  readJson<Json[]>("stories.json").map((d) => prepare<Story>(d)).filter((s) => !s.hidden);

export const fixtureTeam = (): TeamMember[] => readJson<Json[]>("team-members.json").map((d) => prepare<TeamMember>(d));

export const fixtureUniversities = (): University[] =>
  readJson<Json[]>("universities.json").map((d) => prepare<University>(d));

export function fixtureHomePage(): HomePage {
  const raw = readJson<Record<string, Json>>("home-page.json");
  const { featuredStories, ...rest } = raw;
  const page = prepare<HomePage>(rest);
  // Each admit points at a university in the Universities list; look it up
  // the way the live query does (a missing one comes back as null).
  const universities = fixtureUniversities();
  const heroStudents = (page.heroStudents ?? []).map((s) => ({
    ...s,
    admits: (s.admits ?? []).map((a) => {
      const ref = (a.university as { _ref?: string } | null | undefined)?._ref;
      return ref ? { ...a, university: universities.find((u) => u._id === ref) ?? null } : a;
    }),
  }));
  return { ...page, heroStudents, featuredStories: deref(featuredStories as Ref[], fixtureStories()) };
}

export function fixtureAboutPage(): AboutPage {
  const raw = readJson<Record<string, Json>>("about-page.json");
  const { team, ...rest } = raw;
  const page = prepare<AboutPage>(rest);
  return { ...page, team: deref(team as Ref[], fixtureTeam()) };
}

export const fixtureServicesPage = (): ServicesPage => prepare<ServicesPage>(readJson("services-page.json"));
export const fixtureStoriesPage = (): StoriesPage => prepare<StoriesPage>(readJson("stories-page.json"));
export const fixturePrivacyPage = (): PrivacyPage => prepare<PrivacyPage>(readJson("privacy-page.json"));
export const fixtureContactPage = (): ContactPage => prepare<ContactPage>(readJson("contact-page.json"));
export const fixtureRecruitmentPage = (): RecruitmentPage =>
  prepare<RecruitmentPage>(readJson("recruitment-page.json"));

// ── Blog ───────────────────────────────────────────────────────────────────

type SeedTopic = Omit<BlogTopic, "slug"> & { slug: string };

export const fixtureBlogTopics = (): BlogTopic[] =>
  readJson<SeedTopic[]>("blog-topics.json").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

type SeedPost = {
  _id: string;
  title: string;
  slug: { current: string };
  topic?: { _ref: string };
  related?: { _ref: string }[];
  pillar?: boolean;
  excerpt?: string;
  description?: string;
  seoTitle?: string;
  countries?: string[];
  keyPoints?: string[];
  body?: PostBody;
  faq?: Post["faq"];
  sources?: Post["sources"];
  publishedAt?: string;
  reviewedAt?: string;
};

/** The posts in content/blog (or BLOG_SEED_DIR), shaped like the live query's result. */
export function fixturePosts(): Post[] {
  const topics = fixtureBlogTopics();
  const docs = (readPostDocuments(postsDir(root)) as SeedPost[]).map((d) => ({ ...d, slug: d.slug.current }));
  const topicOf = (ref?: string) => {
    const t = topics.find((topic) => topic._id === ref);
    return t ? { _id: t._id, title: t.title, slug: t.slug } : null;
  };
  const posts: Post[] = docs.map((d) => ({
    _id: d._id,
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt,
    description: d.description,
    seoTitle: d.seoTitle,
    pillar: d.pillar,
    countries: d.countries,
    keyPoints: d.keyPoints,
    body: d.body,
    faq: d.faq,
    sources: d.sources,
    publishedAt: d.publishedAt,
    reviewedAt: d.reviewedAt,
    topic: topicOf(d.topic?._ref),
    author: null,
    reviewedBy: null,
    related: (d.related ?? []).map((r): PostLink | null => {
      const target = docs.find((p) => p._id === r._ref);
      return target
        ? {
            _id: target._id,
            title: target.title,
            slug: target.slug,
            excerpt: target.excerpt,
            pillar: target.pillar,
            topic: topicOf(target.topic?._ref),
          }
        : null;
    }),
  }));
  // Same order as the live query: main guides first, then newest checked, then title.
  return posts.sort(
    (a, b) =>
      Number(Boolean(b.pillar)) - Number(Boolean(a.pillar)) ||
      (b.reviewedAt ?? b.publishedAt ?? "").localeCompare(a.reviewedAt ?? a.publishedAt ?? "") ||
      a.title.localeCompare(b.title),
  );
}
