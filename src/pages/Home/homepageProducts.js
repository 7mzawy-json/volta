import { getByCategory, getProduct } from '../../data/products.js';

// What the homepage puts in front of a shopper.
//
// This exists because the homepage used to repeat itself. Three surfaces show
// products — the hero, the spotlight sections and the featured row — and the
// featured row was `phones.slice(0, 4)`. Two things fell out of that:
//
//   1. The hero phone was also the first spotlight AND the first featured card,
//      so the same device appeared three times on one page.
//   2. The catalogue is ordered by brand, so `slice(0, 4)` was four Apple
//      phones in a row — a "featured" strip with no variety in it at all.
//
// Neither was a decision anyone made; both were what the data ordering happened
// to produce. So the rule is now explicit and enforced by a test: NO PRODUCT
// APPEARS TWICE, and the featured row shows a different brand in every slot,
// preferring brands the page has not used yet.

// Named, not derived: what a storefront leads with is an editorial call.
export const HERO_ID = 'iphone-17-pro-max';
export const SPOTLIGHT_IDS = ['galaxy-s26-ultra', 'huawei-pura-90s-pro-max'];
export const FEATURED_COUNT = 4;

export function pickHomepage() {
  const hero = getProduct(HERO_ID) || null;
  const spotlights = SPOTLIGHT_IDS.map(getProduct).filter(Boolean);

  const above = [hero, ...spotlights].filter(Boolean);
  const usedIds = new Set(above.map((p) => p.id));
  const usedBrands = new Set(above.map((p) => p.brand));

  // One phone per brand, so the row cannot collapse into four of one make.
  const firstOfBrand = new Map();
  for (const phone of getByCategory('phones')) {
    if (usedIds.has(phone.id)) continue;
    if (!firstOfBrand.has(phone.brand)) firstOfBrand.set(phone.brand, phone);
  }

  // Brands the page has not shown yet come first: between them, the hero,
  // the spotlights and this row, a shopper sees the breadth of the catalogue
  // rather than one manufacturer three times.
  const candidates = [...firstOfBrand.values()];
  const featured = [
    ...candidates.filter((p) => !usedBrands.has(p.brand)),
    ...candidates.filter((p) => usedBrands.has(p.brand))
  ].slice(0, FEATURED_COUNT);

  return { hero, spotlights, featured };
}
