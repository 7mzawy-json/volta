# VOLTA

**Live: <https://volta-kw.vercel.app>**

Front end on Vercel, API on Render, data in MongoDB Atlas, payments through Stripe
(test mode). One deployment, deliberately: earlier builds also went to Netlify and
GitHub Pages, and neither could host an API, so sign-in, reviews and payment were
broken on both. Both have been retired.

An Arabic-first electronics storefront for the Kuwaiti market — smartphones and accessories,
built as a working front end rather than a set of screens.

Everything is fictional: the brand, the shop and the stock levels. The payments are
real code against a real provider in test mode — Stripe never touches money, and the
card number in the guide is Stripe's own test card.

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5173>. It starts in Arabic; the header has an English toggle.

```bash
npm run build      # production build, must stay clean
npm test                  # front-end unit suite (node --test)
npm --prefix server test  # API suite (node --test + an in-process MongoDB)
npm run test:a11y         # browser checks (Playwright + axe), needs a real Chrome
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
- **Two themes.** Dark — the original neon-on-black — is what the shop opens in, applied
  before the first paint by `public/boot.js`. Light (warm ivory) is the other. The neon is confined to fills in light mode, where it cannot carry text contrast.
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
scripts/        # build tooling: per-route head prerender, a static-host stand-in
server/         # the API — Express, Mongoose, Stripe; its own package.json and tests
tests/          # accessibility and layout checks that need a real browser
.github/        # CI: the unit suites and the build, on every push and pull request
```

## Deploying

Deployment is documented properly in [`docs/deployment.md`](docs/deployment.md) — four
services, and two circular dependencies between them that are worth reading before you
start. What follows is only the part of the build that is easy to get wrong.

```bash
VITE_SITE_ORIGIN=https://your-project.vercel.app npm run build
```

Set the origin, or copy `.env.example` to `.env` and set it once; on Vercel it is an
environment variable in the project settings. It matters more than it looks: **link previews
are built by scrapers that do not run JavaScript.** WhatsApp, Facebook, Slack, iMessage and
LinkedIn read the HTML exactly as served, and Open Graph requires an absolute URL, so the
address has to be baked in at build time rather than discovered from `window.location` the
way the browser does it.

With the origin set, the build writes one small HTML file per route — 46 of them — each
carrying its own title, description, canonical URL, Open Graph tags and (on product pages)
JSON-LD. They all load the same bundle; only the head differs. Vercel checks the filesystem
*before* applying the rewrites in `vercel.json`, so a shared product link previews as that
product, while any unmatched path still falls through to `index.html` and lets React Router
render it.

Without the origin the build still succeeds and prints a warning, and the tags stay
relative — the previous behaviour, rather than a wrong absolute URL pointing at someone
else's site.

To check a build the way a static host will serve it:

```bash
npm run serve:dist
```

`vite preview` is not a substitute here — it answers every path with the root `index.html`,
so the per-route heads never appear and a broken deploy looks fine. The script above
resolves static files first, the way a real host does, and reports which of the two happened
in an `x-volta-served` header.

### One thing kept from the GitHub Pages deploy

`VITE_BASE` and React Router's `basename` exist because Pages served this repo from
`/volta/` rather than from the root. Pages is retired, but the machinery stays: it defaults
to `/`, it costs nothing there, it is covered by tests, and it is the only reason a subpath
deploy would work at all if one is ever wanted again.

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
