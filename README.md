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
  `src/app/blog` is the blog (`/blog/`, `/blog/topics/<topic>/`, `/blog/study-in/<country>/`,
  `/blog/students-from/<country>/`, `/blog/<post>/`). `src/app/%5Fredirects` writes
  Cloudflare's `_redirects` file at build time (see Blog below).
- `src/components` - page sections and components (SCSS modules).
- `src/lib/sanity` - Sanity client, GROQ queries, types and the offline fixture.
- `src/lib/jobs` - formatting helpers and Google JobPosting structured data.
- `src/lib/blog` - blog helpers (addresses, country pages, reading time, heading anchors) and its structured data.
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

Posts are edited in the Studio under **Blog**: **Posts**, **Topics**, **Study
destinations** and **Home countries**. To add a post: Blog, Posts, the pencil button, then fill in
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

### How the blog is arranged

`/blog/` has three ways in:

1. **Where do you want to study?** One page per study destination,
   `/blog/study-in/<country>/` (Studio: Blog, Study destinations).
2. **Where are you from?** One page per home country, grouped by region,
   `/blog/students-from/<country>/` (Studio: Blog, Home countries).
3. **Guides by topic.** Every other post, under its topic. Each topic also has its
   own page, `/blog/topics/<topic>/`.

Each country page shows its **main guide** (a post picked in the Studio) in full,
then more posts, then links to country pages of the other kind:

- A Study in page lists every post whose "Countries this post covers" includes one
  of its countries (Europe's page takes every EU country and "EU"), except posts
  written for particular home countries. It links to the Students from pages whose
  main guide covers it.
- A Students from page lists the posts picked under "List these posts first" and
  every post whose "Written for students from" includes it. It links to the Study
  in pages its main guide covers.
- In front matter, `"origins": ["nigeria"]` is "Written for students from".

A main guide lives only at its country page's address. Its own
`/blog/<post>/` page is not built: every link to it (cards, "Read next", links in
post text) goes to the country page, and the old address redirects there with a
301, through the `_redirects` file that `src/app/%5Fredirects/route.ts` writes into
`out/` at build time. Cloudflare reads that file and does not serve it. Browsers
and search engines remember a 301, so pick a post as a main guide only when it is
written as the guide to that country, and treat the choice as permanent.

A country page with no main guide still works (links to it never break) but shows
only a short list, so it is left off `/blog/` and the sitemap and asks search
engines not to index it.

`/blog/study-in/` and `/blog/students-from/` have no page of their own; they
redirect (302) to their lists on `/blog/`.

The starting country pages are in `content/seed/blog-destinations.json` and
`content/seed/blog-origins.json`, imported once like the posts. The rules above
are in `src/lib/blog/hubs.mjs` and `urls.mjs` (tests: `npm run test:blog`).

### Importing

A push imports the blog only (`SEED_ONLY=blog`). The pages, settings, roles, stories,
team and universities in `content/seed/*.json` were imported long ago and are edited in
the Studio; importing them again would bring back placeholder documents deleted in
the Studio and refill fields emptied on purpose. To import them anyway (for example a
new field's starting text), run the workflow by hand from the Actions tab and choose
`all`.

## Fonts

Poppins is self-hosted from `src/app/fonts` (SIL Open Font License), so builds
do not depend on Google Fonts.
