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

- `src/app` - pages (App Router). `src/app/recruitment/[slug]` is one page per job role;
  `src/app/blog` is the blog (`/blog/`, `/blog/topics/<topic>/`, `/blog/<post>/`).
- `src/components` - page sections and components (SCSS modules).
- `src/lib/sanity` - Sanity client, GROQ queries, types and the offline fixture.
- `src/lib/jobs` - formatting helpers and Google JobPosting structured data.
- `src/lib/blog` - blog helpers (reading time, heading anchors) and its structured data.
- `studio/` - Sanity Studio: schema, editor layout, import script. See `studio/README.md`.
- `content/seed/` - starting content imported into Sanity once; also used by offline test builds.
- `content/blog/` - the starting blog posts, one Markdown file each (see Blog below).
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
  (default `https://hubblebubble.club`)
- `NOINDEX=1` - test deployments only: tells search engines and AI crawlers to skip the site
- `BLOG_SEED_DIR` - read the starting blog posts from another folder (tests only)

## Blog

Posts are edited in the Studio under **Blog**: **Posts** and **Topics** (the six
sections on `/blog/`). To add a post: Blog, Posts, the pencil button, then fill in
the title, the web address (press Generate), the topic, the card text, "In short"
and the post text; add the questions, sources and "Read next" posts, set
"Last checked", and press Publish. The site rebuilds by itself.

The starting posts live in `content/blog/<slug>.md`: JSON front matter between two
`---` lines, then Markdown (`##` and `###` headings, `- ` and `1. ` lists,
`**bold**`, `[links](https://...)` and pipe tables). The import workflow
(`.github/workflows/sanity-seed.yml`) copies each post into Sanity **once**, when it
is not there yet; it never overwrites a post that already exists, so edits made in
the Studio are safe. After the first import, change posts in the Studio, not in
these files. The converter is `content/seed/blog.mjs` (tests: `npm run test:blog`).

A push imports the blog only (`SEED_ONLY=blog`). The pages, settings, roles, stories,
team and universities in `content/seed/*.json` were imported long ago and are edited in
the Studio; importing them again would bring back placeholder documents deleted in
the Studio and refill fields emptied on purpose. To import them anyway (for example a
new field's starting text), run the workflow by hand from the Actions tab and choose
`all`.

## Fonts

Poppins is self-hosted from `src/app/fonts` (SIL Open Font License), so builds
do not depend on Google Fonts.
