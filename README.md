# Hubble Bubble website

Next.js site built as plain static HTML, with content edited in Sanity and
hosted on Cloudflare Workers (static assets).

## How content gets onto the site

1. Editors change content in the Sanity Studio (hosted by Sanity, code in `studio/`).
2. Pressing **Publish** fires a Sanity webhook to a Cloudflare deploy hook.
3. Cloudflare runs `npm run build` (Next.js static export into `out/`) and
   `npx wrangler deploy`, which uploads the files. The site is live a few minutes later.

The site reads **published** content only, with no API token, because the
dataset is public.

## Folders

- `src/app` - pages (App Router). `src/app/recruitment/[slug]` is one page per job role.
- `src/components` - page sections and components (SCSS modules).
- `src/lib/sanity` - Sanity client, GROQ queries, types and the offline fixture.
- `src/lib/jobs` - formatting helpers and Google JobPosting structured data.
- `studio/` - Sanity Studio: schema, editor layout, import script. See `studio/README.md`.
- `content/seed/` - starting content imported into Sanity once; also used by offline test builds.
- `.github/workflows/` - deploys the Studio and imports the starting content.
- `wrangler.jsonc` - Cloudflare config (serves `out/`).

## Local development

```bash
npm install
npm run dev        # site at http://localhost:3000, reads live Sanity content
npm run build      # static export into out/
```

To build without network access to Sanity (test machines), use the seed content:

```bash
SANITY_OFFLINE=1 npm run build
```

Settings read from the environment (all optional):

- `NEXT_PUBLIC_SANITY_PROJECT_ID` (default `qstbrsll`), `NEXT_PUBLIC_SANITY_DATASET` (default `production`)
- `NEXT_PUBLIC_SITE_URL` - public address used for canonical links and structured data

## Fonts

Poppins is self-hosted from `src/app/fonts` (SIL Open Font License), so builds
do not depend on Google Fonts.
