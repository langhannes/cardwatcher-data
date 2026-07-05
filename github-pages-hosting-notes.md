# Notes: hosting a read-only CardWatcher frontend on GitHub Pages

Feasibility notes for publishing a public, read-only "viewer" version of
CardWatcher (no import/download/sync/settings) as a static site on GitHub Pages.

## Short answer

Yes — a read-only public viewer is a good fit for GitHub Pages, but it's a
**build step, not a switch**. Pages only serves static files; it can't run
Flask, so anything computed per-request today must be *pre-rendered* to
HTML/JSON at build time or moved into client-side JS.

## What ports over easily

- **Per-card pages** (`templates/blanko.htm`): mostly static-friendly already.
  The price/availability charts get their data via `market_series=json.dumps(...)`
  baked into the page at render time — Chart.js runs client-side, so charts work
  verbatim. The country/language **filters are already client-side** (they toggle
  `hidden-*` CSS classes in JS), so those keep working.
- **Dashboard** (`app/dashboard.py`): reads `price_history.json` and emits HTML —
  render it once, ship the HTML.
- Data is already file-based and read-only for viewing, and already lives on
  GitHub (`cardwatcher-data`).

## What needs real rework

1. **Routing.** Everything uses query params (`/?name=…`, `/?searchString=…`).
   Pages serves by *path*, so move to static paths like `/card/<name>.html` and
   rewrite the links.
2. **Search / sort / filter.** The gallery is server-rendered by `build_search()`
   and re-queries Flask on every sort/period change. Statically you can't
   pre-render every sort combination — so this becomes **client-side JS** over a
   precomputed `cards.json` index (all cards + summary prices/metrics/image).
   Very doable; the grid is simple.
3. **Strip all mutating/server features**: download/import, sync, settings,
   archive/delete, add-to-collection. Those are inherently server actions.
4. **Collection is private** (lives in `~/.cardwatcher_collection.json`,
   deliberately off the data repo) — exclude it from the public build entirely.

## Recommended shape

A small **static-export build** that *reuses the existing Python/templates* (so
no logic rewrite):

- Iterate all `pages/*.json`, render each card to `card/<name>.html` (chart data
  embedded), copy images.
- Render the dashboard to `index.html`.
- Emit one `cards.json` summary + a bit of vanilla JS for search/sort/filter.
- Publish from a `gh-pages` branch or `/docs`.
- Bonus: a **GitHub Action on the `cardwatcher-data` repo** that rebuilds the
  site on every data push — since data already syncs to GitHub, the public site
  would auto-refresh with no extra step. (Frozen-Flask is the idiomatic tool
  here, but a plain loop calling the existing render functions is just as easy
  and gives more control over the JSON index.)

## Gotchas

- If `cardwatcher-data` is **private**, serving Pages *from* a private repo needs
  GitHub Pro/Team (the published site is still public). Easy workaround: build
  into the public app repo's `/docs`.
- Data/image size: at ~187 cards, nowhere near Pages' ~1 GB / 100 GB-month limits.
- Genuine chunk of work — mostly the routing swap + the client-side search — not
  a weekend-killer, but not trivial either.

## Possible first step

Prototype the export: a `scripts/build_static.py` that produces the dashboard +
card pages + a working client-side search into `docs/`, push to Pages, and see it
live before committing to the full thing.
