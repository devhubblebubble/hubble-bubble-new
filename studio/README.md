# Hubble Bubble content editor (Sanity Studio)

This folder is the content editor for the website. Editors use it in the
browser at the hosted address; nobody needs to run code to change content.

- Project: `qstbrsll`, dataset: `production`
- Content types: the pages (home, about, services, stories, jobs, contact, privacy),
  Job role, Student story, Team member, University, Blog post, Blog topic, Study destination,
  Home country, Site settings (the blog's arrangement is explained in the main README, under Blog)
- Hosted by Sanity; deployed by the GitHub Action in `.github/workflows/sanity-studio.yml`
- Starting content: `content/seed/*.json` and the blog posts in `content/blog/*.md`,
  imported once by `.github/workflows/sanity-seed.yml` (existing documents are never overwritten)

Local development (optional, for developers):

```
cd studio
npm install
npm run dev
```
