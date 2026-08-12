# Static Web — branch-specific GitHub Pages sites

This repository publishes selected development branches into separate subdirectories of one GitHub Pages project.

## Current site

- Source branch: `trip/taiwan-2026-08`
- Public slug: `taiwan-2026-08`
- Expected URL: <https://loopallan.github.io/static-web/taiwan-2026-08/>
- Framework: Astro 7, static output

## Local development

```bash
npm ci
npm run dev
```

Full verification:

```bash
npm run validate
```

## Publishing architecture

The workflow builds the source branch with the configured Astro base path, fetches the latest durable `gh-pages` tree, replaces only the current site's slug directory, regenerates the root site index, and deploys the complete tree.

```text
gh-pages/
├── index.html
├── taiwan-2026-08/
└── another-site/
```

Publishing is serialized with a repository-wide concurrency group so two site deployments cannot overwrite each other's read-modify-write operation.

Before the first workflow run, a repository administrator must enable GitHub Pages once and select **GitHub Actions** as the source. The equivalent REST bootstrap is `POST /repos/LoopAllan/static-web/pages` with `{"build_type":"workflow"}`. This administrative credential is intentionally kept out of the recurring deployment workflow; subsequent runs use only the scoped `GITHUB_TOKEN` permissions declared per job.

To add another site, create a branch with its own explicit slug, configure Astro's `base` as `/static-web/<slug>`, add the branch trigger and slug mapping to the workflow, and extend the architecture contract test before implementing the page.
