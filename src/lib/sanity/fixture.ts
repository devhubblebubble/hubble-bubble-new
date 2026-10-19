// Offline content for test builds (SANITY_OFFLINE=1): the same JSON files the
// import script loads into Sanity, converted to the shape the live API returns.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { PortableTextBlock } from "@portabletext/types";
import type { JobRole, SiteSettings } from "./types";

const seedDir = path.join(process.cwd(), "content", "seed");

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

type SeedRole = Omit<JobRole, "about" | "closingDate"> & {
  about?: string[];
  closingDate?: string | null;
};

export function fixtureRoles(): JobRole[] {
  return readJson<SeedRole[]>("job-roles.json").map((r) => ({
    ...r,
    about: toBlocks(r.about),
    closingDate: r.closingDate ?? undefined,
  }));
}

export function fixtureSettings(): SiteSettings {
  return readJson<SiteSettings>("site-settings.json");
}
