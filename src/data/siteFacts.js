import { products } from './products.js';
import { currencies } from './currencies.js';
import { matchesSearchParams } from './search.js';
import { validateIntent, intentToSearchParams } from './searchIntent.js';

// What the homepage says about itself.
//
// The section this feeds replaced four sales claims, one of which — a year of
// warranty on every device — was simply invented. A fictional shop can describe
// its own construction honestly even when it cannot describe its stock, so the
// rule for this file is: every number is either COUNTED from the catalogue here,
// measured by the browser at runtime, or recorded with the command that
// re-measures it. Nothing is asserted because it sounds good.

// --- counted ------------------------------------------------------------------

export const LISTINGS = products.length;

// The variant rule made visible: a phone is one listing however many colours and
// sizes it sells in. This is the number of things you can actually buy.
export const VARIANTS = products.reduce((n, product) => n + product.variants.length, 0);

export const CURRENCIES = currencies.length;

// How many of them subdivide into 1000 rather than 100 — the dinar family, which
// is the whole reason this storefront carries money as integer fils.
//
// Counted, and counted because of a mistake: this line first read "the dinar at
// three decimals, the yen at none", and there is no yen here. An invented example
// in the one section whose rule is that nothing is invented. A number the table
// produces cannot be wrong the way a remembered example can.
export const THREE_DECIMAL_CURRENCIES = currencies.filter(
  (currency) => currency.decimals === 3
).length;

// Routes given their own <head> at build time, so a link shared into WhatsApp or
// read by a crawler that never runs JavaScript still has a title, a description
// and a preview image.
//
// Cart and checkout are deliberately absent: they describe one person's session,
// they are not shareable, and giving them polished previews would only invite
// sharing them.
//
// This list is the build script's source of truth as well as the homepage's —
// scripts/prerender-meta.js imports it — so the count on the page cannot drift
// away from the number of files the build actually writes.
export const PRERENDERED_ROUTES = [
  '/',
  '/products',
  '/wishlist',
  '/compare',
  ...products.map((product) => `/products/${product.id}`)
];

// --- recorded -----------------------------------------------------------------

// The only figure here that nothing in the running app can count.
//
// Re-measure with, from the repository root:
//   npm test && (cd server && npm test) && npx playwright test --list
// and add the three totals. Last measured 2026-09-11: 151 front end + 79 server
// + 14 accessibility.
export const TESTS = 244;

// --- the sentence reader's demo ------------------------------------------------

// One canned sentence, shown on the homepage as chips.
//
// Canned on purpose. A live model call on every homepage visit would cost money
// for a shopper who did not ask for it and would put a spinner in the middle of
// the page; the real reader lives in the search box, where somebody has actually
// typed something. What is NOT canned is the result: the intent below goes
// through the same validateIntent the model's answer does, becomes a URL through
// the same intentToSearchParams, and the number on the link is counted against
// the real catalogue. If the catalogue moves under it, the test fails.
const DEMO_REQUEST = {
  category: 'phones',
  screen: ['large'],
  price: [null, 300],
  sort: 'price-low'
};

// The ceiling the sentence quotes. Printed through the money formatter so the
// sentence, the chip and the shopper's chosen currency agree; the URL keeps the
// dinar figure, which is the unit the listing page filters in.
export const DEMO_PRICE_CEILING = 300;

export const DEMO_INTENT = validateIntent(DEMO_REQUEST).intent;
export const DEMO_PARAMS = intentToSearchParams(DEMO_INTENT);
export const DEMO_HREF = `/products?${DEMO_PARAMS.toString()}`;
export const DEMO_COUNT = products.filter((p) => matchesSearchParams(p, DEMO_PARAMS)).length;
