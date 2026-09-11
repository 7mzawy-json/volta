import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from './products.js';
import { currencies } from './currencies.js';
import { matchesSearchParams } from './search.js';
import { isUsefulIntent, validateIntent } from './searchIntent.js';
import {
  CURRENCIES,
  DEMO_COUNT,
  DEMO_HREF,
  DEMO_INTENT,
  DEMO_PRICE_CEILING,
  LISTINGS,
  PRERENDERED_ROUTES,
  TESTS,
  VARIANTS
} from './siteFacts.js';

// The homepage's build sheet states numbers about this site. These are what stop
// it from stating numbers that used to be true.
//
// The section it replaced claimed a year of warranty on every device, which was
// never true and which nothing could have caught. Everything here is either
// counted from the catalogue or checked against it.

// --- the counted facts are counted, not remembered ---------------------------

test('the listing and variant counts come from the catalogue', () => {
  assert.equal(LISTINGS, products.length);
  assert.equal(
    VARIANTS,
    products.reduce((n, product) => n + product.variants.length, 0)
  );
  // The claim the numbers make together — one listing, many things to buy — only
  // holds while there are more variants than listings.
  assert.ok(VARIANTS > LISTINGS);
});

test('the currency count comes from the currency table', () => {
  assert.equal(CURRENCIES, Object.keys(currencies).length);
});

test('the tests figure is a plausible hand-recorded number', () => {
  // It cannot be derived — a suite cannot count itself without running itself —
  // so this only guards against the placeholder or a slipped decimal. The
  // command that re-measures it is in siteFacts.js.
  assert.ok(Number.isInteger(TESTS) && TESTS > 50 && TESTS < 5000);
});

// --- the prerendered route list -----------------------------------------------

test('every product has a prerendered route, and no route is written twice', () => {
  for (const product of products) {
    assert.ok(
      PRERENDERED_ROUTES.includes(`/products/${product.id}`),
      `${product.id} has no prerendered route`
    );
  }
  assert.equal(new Set(PRERENDERED_ROUTES).size, PRERENDERED_ROUTES.length);
});

test('the session pages are deliberately absent', () => {
  // Cart and checkout describe one person's session. A polished preview on
  // either only invites sharing them.
  for (const route of ['/cart', '/checkout']) {
    assert.ok(!PRERENDERED_ROUTES.includes(route));
  }
});

test('the routes are the static pages plus one per product', () => {
  assert.equal(PRERENDERED_ROUTES.length, 4 + products.length);
});

// --- the canned demo is not canned all the way down ---------------------------

test('the demo intent passes the same wall the model has to pass', () => {
  // Re-validating an already-validated intent must not change it. If it does,
  // the panel is showing something validateIntent would have refused.
  const { intent, dropped } = validateIntent(DEMO_INTENT);
  assert.deepEqual(intent, DEMO_INTENT);
  assert.deepEqual(dropped, []);
  assert.ok(isUsefulIntent(DEMO_INTENT));
});

test('the demo intent says what the chips say', () => {
  // The panel builds its chips by reading these fields. If one goes away the
  // chip goes away silently, so the shape is pinned here.
  assert.equal(DEMO_INTENT.category, 'phones');
  assert.deepEqual(DEMO_INTENT.screen, ['large']);
  assert.equal(DEMO_INTENT.sort, 'price-low');
  assert.equal(DEMO_INTENT.price[1], DEMO_PRICE_CEILING);
  assert.equal(DEMO_INTENT.q, '');
});

test('the link leads somewhere, and to exactly what it promises', () => {
  // The whole point of the panel is that the sentence became real filters. A
  // link that lands on an empty page would demonstrate the opposite.
  assert.ok(DEMO_COUNT > 0, 'the demo sentence now matches nothing');

  const params = new URLSearchParams(DEMO_HREF.split('?')[1]);
  const matching = products.filter((p) => matchesSearchParams(p, params));
  assert.equal(matching.length, DEMO_COUNT);

  // And it is a narrowing, not a link to the whole catalogue dressed up as one.
  assert.ok(DEMO_COUNT < products.length);
});

test('every product behind the demo link really is under the ceiling', () => {
  const params = new URLSearchParams(DEMO_HREF.split('?')[1]);
  for (const product of products.filter((p) => matchesSearchParams(p, params))) {
    assert.equal(product.category, 'phones');
    assert.ok(
      product.attributes.screen > 6.8,
      `${product.id} is not a big screen`
    );
    assert.ok(
      Math.min(...product.variants.map((v) => v.price)) <= DEMO_PRICE_CEILING,
      `${product.id} costs more than the sentence asked for`
    );
  }
});
