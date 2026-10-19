// Offline content for test builds (SANITY_OFFLINE=1): the same JSON files the
// import script loads into Sanity, converted to the shape the live queries
// return (markup -> Portable Text, images -> local /public paths with sizes,
// references -> the referenced documents).
import { readFileSync } from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";
import type { PortableTextBlock } from "@portabletext/types";
import { convertMarkupFields } from "../../../content/seed/markup.mjs";
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

export function fixtureHomePage(): HomePage {
  const raw = readJson<Record<string, Json>>("home-page.json");
  const { featuredStories, ...rest } = raw;
  const page = prepare<HomePage>(rest);
  return { ...page, featuredStories: deref(featuredStories as Ref[], fixtureStories()) };
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
