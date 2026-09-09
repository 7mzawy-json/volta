# VOLTA

**Live: <https://volta-demo-v1.netlify.app>** · also on [GitHub Pages](https://7mzawy-json.github.io/volta/)

An Arabic-first electronics storefront for the Kuwaiti market — smartphones and accessories,
built as a working front end rather than a set of screens.

Everything is fictional: the brand, the shop, the stock levels and the orders. Checkout
takes an address and a payment method and then stops, by design. There is no server.

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>. It starts in Arabic; the header has an English toggle.

```bash
npm run build      # production build, must stay clean
npm test           # 16 unit tests (node --test)
npm run test:a11y  # 10 browser checks (Playwright + axe)
npm run test:all   # both
```

`test:a11y` drives a real Chrome. It starts the dev server itself, and needs either an
installed Chrome or `PLAYWRIGHT_CHANNEL` pointed at a Playwright-managed browser.

## What is worth looking at

- **Arabic is the default, not a translation layer.** The document boots RTL before React
  runs, layout uses CSS logical properties throughout, and the English toggle mirrors the
  whole interface rather than restyling it.
- **Prices are Kuwaiti dinar at three decimals** — `389.900 KD` / `389.900 د.ك`. A dinar is
  1000 fils, so two decimals would be wrong money, not just wrong formatting.
- **A phone is one listing, not one listing per colour.** 42 listings expand to 124
  purchasable variants across a storage × colour matrix; the cart addresses a variant.
- **No product photography.** Every phone and accessory is a colour-accurate vector drawn
  from its own palette, which is why the whole site is smaller than one photograph.
- **Two themes.** Light (warm ivory) is the default; the original neon-on-black is dark
  mode. The neon is confined to fills in light mode, where it cannot carry text contrast.
- **Filters are data.** Facets come from a per-category table, and their counts are computed
  against the *other* active filters, so a count never promises results it cannot deliver.

## The pages

Home → Products → Product → Cart → Checkout → Confirmation, plus Wishlist, Compare, and a
404. Search, comparison, wishlist and cart state persist in `localStorage`.

## Layout

```
src/
  components/   # presentational units, one folder each with its CSS module
  context/      # cart, wishlist, compare, language, theme, toasts
  data/         # catalogue, copy (ar + en), colours, Kuwait geography, search index
  hooks/        # useDialog — the shared modal behaviour for every drawer
  pages/        # one folder per route
  utils/        # currency, pluralisation, document metadata
assets/         # design tokens (the source of both themes), brand mark
docs/           # brand guidelines, user flow, ad script and its production guide
scripts/        # build and deploy tooling: per-route head prerender, Netlify-like server
tests/          # accessibility and layout checks that need a real browser
```

## Deploying

The site is static. Build it, then upload the **contents** of `dist/` — Netlify's
drag-and-drop wants `index.html` at the root of the archive, not nested inside a folder.

```bash
VITE_SITE_ORIGIN=https://your-site.netlify.app npm run build
```

Set the origin, or copy `.env.example` to `.env` and set it once. It matters more than it
looks: **link previews are built by scrapers that do not run JavaScript.** WhatsApp,
Facebook, Slack, iMessage and LinkedIn read the HTML exactly as served, and Open Graph
requires an absolute URL, so the address has to be baked in at build time rather than
discovered from `window.location` the way the browser does it.

With the origin set, the build writes one small HTML file per route — 46 of them — each
carrying its own title, description, canonical URL, Open Graph tags and (on product pages)
JSON-LD. They all load the same bundle; only the head differs. Netlify serves a matching
file before it consults `public/_redirects`, so a shared product link previews as that
product, while any unmatched path still falls through the SPA rewrite to `index.html`.

Without the origin the build still succeeds and prints a warning, and the tags stay
relative — the previous behaviour, rather than a wrong absolute URL pointing at someone
else's site.

To check a build the way Netlify will serve it:

```bash
npm run serve:dist
```

`vite preview` is not a substitute here — it answers every path with the root
`index.html`, so the per-route heads never appear and a broken deploy looks fine. The
script above resolves static files first, exactly as Netlify does, and reports which of the
two happened in an `x-volta-served` header.

### GitHub Pages

Also deployed to <https://7mzawy-json.github.io/volta/>, automatically, by
[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) on every push to
`main`. Nothing to run by hand.

Pages serves a project repo from a **subpath**, which is the whole difficulty: with Vite's
default `base` of `/`, every asset URL points at the domain root and the page renders blank.
So the base is an environment variable rather than a constant —

```bash
VITE_BASE=/volta/ VITE_SITE_ORIGIN=https://7mzawy-json.github.io npm run build
```

— and it defaults to `/`, so the Netlify build needs no change. Three things follow from it,
all handled: React Router gets a `basename` (or every route 404s), `resolveDocumentMetadata`
prefixes the base onto canonical, `og:` and JSON-LD URLs (or they advertise addresses the
host does not serve), and the build writes a `404.html` — Pages has no rewrite rules and
serves that file for anything it cannot match, which is how the SPA fallback works there.

To check a build the way *Pages* will serve it:

```bash
npm run serve:pages
```

That mounts `dist/` under `/volta/` and imitates Pages' resolution — static file first, then
`404.html` with a real 404 status, rather than Netlify's 200 rewrite.

## Documentation

- [`docs/brand-guidelines.md`](docs/brand-guidelines.md) — identity, palette, voice, market.
- [`docs/user-flow.md`](docs/user-flow.md) — the shopper's path through the pages.
- [`docs/ad-script.md`](docs/ad-script.md) — the AI-generated ad, shot by shot.
- [`docs/ad-production-guide.md`](docs/ad-production-guide.md) — how to actually produce it.
- [`docs/deployment.md`](docs/deployment.md) — Atlas, Stripe, Render and Vercel, in an order that works.

## A note on how this was built

This project was built with AI assistance — three agents working in one repository under a
shared set of rules, each change recorded with what was done, why, how it was verified and
what stayed risky. That working log is kept privately rather than in this repository; it is
available on request.
