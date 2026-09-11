import {
  products,
  brandLabels,
  getPriceRange,
  getFacets,
  productMatchesFacet,
  productMatchesPrice
} from './products.js';
import { getColor } from './colors.js';

// Search.
//
// The old behaviour matched product name and brand only, so "256GB", "5G",
// "orange" or "big battery" returned nothing at all — every one of which is how
// people actually shop for a phone. Each listing now carries a searchable
// haystack built from everything a shopper might reasonably type.
//
// The haystack is built ONCE at module load, not per keystroke. Rebuilding 30
// strings on every character is invisible at this size and ruinous at 3,000, and
// the project's scaling rule is no linear work in a render path.

function haystackFor(product) {
  const parts = [product.name.en, product.name.ar, brandLabels[product.brand] || '', product.brand];

  // Storage sizes, with and without the unit: "256GB" and "256" both hit.
  for (const v of product.variants) {
    if (v.storage) parts.push(v.storage, v.storage.replace(/GB|TB/i, ''));
    if (v.color) {
      const c = getColor(v.color);
      parts.push(c.name.en, c.name.ar, v.color.replace(/-/g, ' '));
    }
  }

  const a = product.attributes || {};
  if (a.screen) parts.push(`${a.screen}"`, `${a.screen} inch`, `${a.screen} بوصة`);
  if (a.camera) parts.push(`${a.camera}MP`, `${a.camera} ميجابكسل`);
  if (a.battery) parts.push(`${a.battery}mAh`, `${a.battery} مللي أمبير`);
  if (a.os) parts.push(a.os);
  // Everything sold here is 5G-capable, and "5g" is a common query.
  if (product.category === 'phones') parts.push('5g');

  parts.push(product.category);
  return parts.filter(Boolean).join(' ').toLowerCase();
}

const index = new Map(products.map((p) => [p.id, haystackFor(p)]));

// Ranked so a name match always outranks an incidental attribute match —
// searching "Pro" should lead with phones called Pro, not everything with a
// pro-grade camera.
function scoreFor(product, term) {
  const nameEn = product.name.en.toLowerCase();
  const nameAr = product.name.ar;
  if (nameEn.startsWith(term) || nameAr.startsWith(term)) return 4;
  if (nameEn.includes(term) || nameAr.includes(term)) return 3;
  if ((brandLabels[product.brand] || '').toLowerCase().includes(term)) return 2;
  return index.get(product.id).includes(term) ? 1 : 0;
}

// Every whitespace-separated term must match somewhere, so "samsung 512" narrows
// rather than widening the way an OR would.
function termsOf(query) {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

// Does this product match at all? The predicate on its own, so the listing page
// and the suggestion dropdown can share one definition of "matches".
//
// They did not share one, and that was a real defect: suggestions searched the
// full haystack while the results page searched names and brands only. Typing
// "256GB" offered six phones and then, on submitting the same query, said "0
// results". The listing is the page that has to agree with what it just
// suggested.
export function matchesQuery(product, query) {
  const terms = termsOf(query);
  if (!terms.length) return true;
  return terms.every((term) => scoreFor(product, term) > 0);
}

// Ranked and capped, for the dropdown.
export function searchProducts(query, limit = 6) {
  const terms = termsOf(query);
  // A single letter would offer most of the catalogue, so suggestions wait for
  // two. The listing has no such rule — see rankProducts.
  if (!terms.length || terms.join('').length < 2) return [];
  return rankProducts(query).slice(0, limit);
}

// Ranked, uncapped: the same order as the dropdown, for the whole result set.
export function rankProducts(query) {
  const terms = termsOf(query);

  return products
    .map((product) => {
      const scores = terms.map((t) => scoreFor(product, t));
      if (scores.some((s) => s === 0)) return null;
      return { product, score: Math.max(...scores) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || getPriceRange(a.product).min - getPriceRange(b.product).min)
    .map((r) => r.product);
}

// Does this product match a whole set of URL parameters — category, query,
// facets and price, exactly as the listing page reads them?
//
// The listing page filters in two steps because it needs the intermediate
// result (the price slider's bounds and the empty state's "without this filter"
// counts are both taken before the facets apply). Anything that only wants the
// final answer — the homepage's build sheet counts its demo link this way —
// should use this instead of writing a third copy of the rules.
export function matchesSearchParams(product, params) {
  const category = params.get('category') || 'all';
  if (category !== 'all' && product.category !== category) return false;
  if (!matchesQuery(product, params.get('q') || '')) return false;

  const [lo, hi] = (params.get('price') || '').split('-').map(Number);
  const range = Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : null;
  if (!productMatchesPrice(product, range)) return false;

  return getFacets(category)
    .filter((facet) => facet.type !== 'range')
    .every((facet) =>
      productMatchesFacet(
        product,
        facet,
        (params.get(facet.id) || '').split(',').filter(Boolean)
      )
    );
}
