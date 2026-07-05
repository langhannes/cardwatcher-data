# CardWatcher static viewer

A public, **read-only** web viewer for the card data in this repo — a static
re-implementation of the CardWatcher UI (dashboard, search grid, per-card page)
with none of the import / download / sync / settings / collection machinery.
It runs entirely in the browser: the Python calculations that CardWatcher does
per request (search sorting/filtering, dashboard ranking, per-card row and chart
rendering) are ported to client-side JavaScript here.

## Layout

```
docs/
  index.html      Dashboard  (movers / supply / pressure)   -> js/dashboard.js
  search.html     Search grid (filter / sort / period)      -> js/search.js
  card.html       Per-card page (rows + charts + filters)   -> js/card.js + js/card-interactions.js
  js/cw-common.js Shared flag/language tables + helpers (from app/language_libraries.py)
  assets/         CSS/JS/sprites copied from the CardWatcher app's static/
  manifest.json   Generated card index (see scripts/gen_manifest.py)
```

The viewer reads the repo's data directly via `fetch`: `changes/price_history.json`
(all per-card metrics), `pages/<name>.json` / `archive/<name>.json` (per-card
listings), and `images/<name>.jpg`. These live at the repo root, so the site is
served with those directories mounted alongside `docs/` at the same root (see
below).

## Run locally

```bash
python scripts/gen_manifest.py     # (optional; serve.py also does this)
python scripts/serve.py            # http://localhost:8000
```

`serve.py` serves `docs/` as the site root and maps `pages/`, `changes/`,
`images/`, `archive/` to the same root — the exact layout the deploy assembles,
so paths behave identically in dev and production.

## Deploy (GitHub Pages)

`.github/workflows/deploy-pages.yml` runs on every push that touches data or the
viewer. It regenerates `manifest.json`, assembles a site root from `docs/` +
the data directories, and deploys it to GitHub Pages. Enable Pages once under
**Settings → Pages → Source: GitHub Actions**.

## What's intentionally excluded

Import, download, sync, settings, archive/delete/toggle actions, and the entire
Collection feature (its data lives outside this repo, in
`~/.cardwatcher_collection.json`, and is deliberately private).

## Charts

The per-card price chart draws all five series the app does — **Trend** and
**Raw** (from the listing data) plus the **Blend / Sold / Floor** market-price
overlays, computed in `js/card-market.js` (a port of
`watcherbase.calculate_market_price_series` and its helpers). The JS output was
validated to match the Python to the cent.
