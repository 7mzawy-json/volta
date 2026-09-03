# VOLTA

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
node scripts/serve-dist.js
```

`vite preview` is not a substitute here — it answers every path with the root
`index.html`, so the per-route heads never appear and a broken deploy looks fine. The
script above resolves static files first, exactly as Netlify does, and reports which of the
two happened in an `x-volta-served` header.

## Documentation

- [`docs/brand-guidelines.md`](docs/brand-guidelines.md) — identity, palette, voice, market.
- [`docs/user-flow.md`](docs/user-flow.md) — the shopper's path through the pages.
- [`docs/ad-script.md`](docs/ad-script.md) — the AI-generated ad, shot by shot.
- [`docs/ad-production-guide.md`](docs/ad-production-guide.md) — how to actually produce it.
- [`HANDOFF.md`](HANDOFF.md) — engineering context: rules, architecture, and a change log.

## A note on how this was built

Three AI agents worked in this repository — Claude Code, ChatGPT Codex and Gemini — under
the rules in [`HANDOFF.md`](HANDOFF.md). Every change carries a signed entry in its change
log saying what was done, why, how it was verified, and what remains risky. Agents review
and correct each other's entries in writing rather than silently reverting them, so the log
also records the arguments and the retractions.
