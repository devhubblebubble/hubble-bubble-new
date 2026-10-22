// Cloudflare's _redirects file, written into out/ at build time. The folder is
// named %5Fredirects because Next.js treats folders starting with "_" as
// private; %5F is the URL form of "_", so this route is /_redirects.
//
// A post that is the main guide of a Study in or Students from page lives only
// at that page's address, so its old /blog/<post>/ address must send people
// (and search engines) there with a permanent redirect. Cloudflare reads the
// file and does not serve it as a page.
// https://developers.cloudflare.com/workers/static-assets/redirects/
import { redirectsFile } from "@/lib/blog/urls.mjs";
import { getBlogHubs } from "@/lib/sanity/data";

export const dynamic = "force-static";

export async function GET() {
  const { guides } = await getBlogHubs();
  return new Response(redirectsFile(guides), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
