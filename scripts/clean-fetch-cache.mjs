// Next.js keeps a copy of every fetch it makes while building, in
// .next/cache/fetch-cache, so its build workers can share them. Cloudflare
// restores that folder from the previous build, so the site kept serving old
// Sanity content after a publish. Clearing it first means every build reads
// Sanity fresh.
import { rmSync } from "node:fs";

rmSync(".next/cache/fetch-cache", { recursive: true, force: true });
