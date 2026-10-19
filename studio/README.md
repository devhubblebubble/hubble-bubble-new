# Hubble Bubble content editor (Sanity Studio)

This folder is the content editor for the website. Editors use it in the
browser at the hosted address; nobody needs to run code to change content.

- Project: `qstbrsll`, dataset: `production`
- Content types: Job role, Site settings
- Hosted by Sanity; deployed by the GitHub Action in `.github/workflows/sanity-studio.yml`
- Starting content: `content/seed/*.json`, imported once by `.github/workflows/sanity-seed.yml`

Local development (optional, for developers):

```
cd studio
npm install
npm run dev
```
