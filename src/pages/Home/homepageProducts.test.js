import test from 'node:test';
import assert from 'node:assert/strict';
import { FEATURED_COUNT, HERO_ID, SPOTLIGHT_IDS, pickHomepage } from './homepageProducts.js';

// The course instructor's note was "avoid repeating the same product multiple
// times". These tests are the fix: the repetition was a data-ordering accident,
// so the guard has to be a test rather than a careful choice someone remembers.

test('no product appears twice anywhere on the homepage', () => {
  const { hero, spotlights, featured } = pickHomepage();
  const ids = [hero, ...spotlights, ...featured].filter(Boolean).map((p) => p.id);

  assert.equal(new Set(ids).size, ids.length, `repeated product on the homepage: ${ids.join(', ')}`);
});

test('the hero and the spotlights are three different phones', () => {
  const { hero, spotlights } = pickHomepage();

  assert.equal(hero.id, HERO_ID);
  assert.equal(spotlights.length, SPOTLIGHT_IDS.length);
  assert.ok(!spotlights.some((p) => p.id === hero.id), 'a spotlight repeats the hero');
});

test('the featured row shows a different brand in every slot', () => {
  const { featured } = pickHomepage();

  assert.equal(featured.length, FEATURED_COUNT);
  const brands = featured.map((p) => p.brand);
  assert.equal(new Set(brands).size, brands.length, `featured row repeats a brand: ${brands.join(', ')}`);
});

test('the featured row prefers brands the page has not used above it', () => {
  const { hero, spotlights, featured } = pickHomepage();
  const above = new Set([hero, ...spotlights].filter(Boolean).map((p) => p.brand));

  // The catalogue has seven phone brands and the page shows at most three
  // above the row, so a four-slot row can always be filled with fresh ones.
  const reused = featured.filter((p) => above.has(p.brand)).map((p) => p.brand);
  assert.deepEqual(reused, [], `featured row reuses a brand from above: ${reused.join(', ')}`);
});

test('every pick resolves to a real product', () => {
  const { hero, spotlights, featured } = pickHomepage();

  for (const product of [hero, ...spotlights, ...featured]) {
    assert.ok(product, 'a homepage slot resolved to nothing');
    assert.ok(product.name.ar && product.name.en, `${product.id} is missing a name`);
    assert.ok(product.variants.length > 0, `${product.id} has no variants`);
  }
});
