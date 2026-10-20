// Copies the square (1x1) country flags from the flag-icons package into
// public/images/flags so the student cards can show a real flag on every
// device (emoji flags render as two letters on Windows). Runs as part of
// `npm run build`; the folder is not committed.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const source = path.join(path.dirname(require.resolve("flag-icons/package.json")), "flags", "1x1");
const target = path.join(root, "public", "images", "flags");

if (!existsSync(source)) {
  console.error(`copy-flags: ${source} not found. Is flag-icons installed?`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`copy-flags: ${readdirSync(target).length} flags -> public/images/flags`);
