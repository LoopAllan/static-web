# TossBox 地圖優先 Prototype

此分支是 TossBox prototype 的獨立 GitHub Pages source branch。

- Source branch: `site/tossbox-prototype-v1`
- Public slug: `tossbox-prototype-v1`
- Expected URL: `https://loopallan.github.io/static-web/tossbox-prototype-v1/`
- Framework: Astro static output

## Scope

Prototype verifies a map-first decision flow with confirmed `PlaceResolution` records as the display unit. All place names, images, ratings, addresses, and freshness labels are mock data; this branch does not call TossBox, Google Maps, Google Places, or authentication APIs.

## Local validation

```bash
npm ci
npm run validate
```

## Publishing model

The repository publishes selected source branches into separate subdirectories of the durable `gh-pages` tree. This branch must not be merged into the Taiwan-trip source branch because doing so would replace that separate site. The deployment workflow preserves every other published slug.
