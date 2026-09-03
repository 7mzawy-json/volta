// Catalog schema
// ---------------
// A product is a *listing*; the thing you actually buy is a VARIANT. Phones ship
// in several storage sizes at different prices and stock levels, so price and
// stock live on the variant, never on the product. Accessories have no storage
// axis but do come in finishes, so they expand to one variant per colour — the
// same code path, not a special case.
//
// `attributes` holds structured, comparable values (numbers and enums, not prose)
// so filtering, sorting and a future compare view can all read the same fields.
// Accessories carry hand-written `specs`; phones derive theirs from `attributes`
// below, so a phone's spec sheet and the filters can never disagree.

import { phones } from './phones.js';
import { accessories } from './accessories.js';

// Phones lead: it is the vertical the shop is built around.
export const categories = ['phones', 'chargers', 'audio', 'accessories', 'smart'];

export const brands = ['apple', 'samsung', 'huawei', 'honor', 'oppo', 'xiaomi', 'tecno', 'volta'];

// Brand names are proper nouns and stay in Latin script in both languages —
// that is how they are printed on the boxes and typed into search.
export const brandLabels = {
  apple: 'Apple',
  samsung: 'Samsung',
  huawei: 'Huawei',
  honor: 'Honor',
  oppo: 'Oppo',
  xiaomi: 'Xiaomi',
  tecno: 'Tecno',
  volta: 'VOLTA'
};


// --- derived spec sheets ---------------------------------------------------
// Phones describe themselves through `attributes`, so their bullet list is
// generated rather than written twice. One source of truth means the spec sheet
// a shopper reads and the value a filter matches on cannot drift apart.

const specFormatters = [
  { key: 'screen', ar: (v) => `شاشة ${v} بوصة`, en: (v) => `${v}-inch display` },
  { key: 'ram', ar: (v) => `ذاكرة ${v} جيجابايت`, en: (v) => `${v}GB RAM` },
  { key: 'camera', ar: (v) => `كاميرا ${v} ميجابكسل`, en: (v) => `${v}MP main camera` },
  { key: 'battery', ar: (v) => `بطارية ${v} مللي أمبير`, en: (v) => `${v}mAh battery` },
  { key: 'refreshRate', ar: (v) => `معدل تحديث ${v} هرتز`, en: (v) => `${v}Hz refresh rate` },
  { key: 'network', ar: (v) => (v === '5g' ? 'يدعم شبكات 5G' : 'شبكة 4G'), en: (v) => (v === '5g' ? '5G ready' : '4G network') }
];

function deriveSpecs(attributes) {
  const pick = specFormatters.filter((f) => attributes[f.key] !== undefined);
  return {
    ar: pick.map((f) => f.ar(attributes[f.key])),
    en: pick.map((f) => f.en(attributes[f.key]))
  };
}

// --- variant expansion -----------------------------------------------------
// Phones declare storages x colors; the variant matrix is built here. Storage
// sizes stay in Latin ("256GB") in both languages — that is how they are printed
// and how Kuwaiti retail, Xcite included, writes them on Arabic pages too.

// Stock is deterministic per variant rather than random, so the same phone shows
// the same availability on every reload and screenshots stay reproducible.
function stockFor(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % 17;
}

// Handles both shapes. A phone declares `storages` (each with its own price) and
// `colors`, giving a full matrix. An accessory declares one `price` and `colors`,
// giving one variant per finish — expressed as a single null storage tier so the
// loop stays one loop rather than two branches.
function expandVariants(product) {
  const soldOut = new Set(product.soldOut || []);
  const tiers = product.storages || [{ size: null, price: product.price }];
  const colors = product.colors || [null];
  const variants = [];

  for (const tier of tiers) {
    for (const color of colors) {
      const combo = [tier.size, color].filter(Boolean).join('/');
      const idParts = [product.id, tier.size, color].filter(Boolean);
      variants.push({
        id: idParts.join('--').toLowerCase(),
        // Only a real storage tier earns a label; an accessory's colour is shown
        // through the swatch and the variant label, not duplicated here.
        label: tier.size ? { ar: tier.size, en: tier.size } : null,
        storage: tier.size,
        color,
        price: tier.price,
        stock: soldOut.has(combo) ? 0 : stockFor(product.id + combo)
      });
    }
  }
  return variants;
}

export const products = [
  ...phones.map((p) => ({
    ...p,
    icon: 'phone',
    specs: p.specs || deriveSpecs(p.attributes),
    variants: expandVariants(p)
  })),
  ...accessories.map((a) => ({
    ...a,
    specs: a.specs || deriveSpecs(a.attributes),
    variants: expandVariants(a)
  }))
];

// --- indexes ---------------------------------------------------------------
// Built once at module load. Lookups used to be linear scans, and findVariant a
// nested scan run for every cart line on every render — fine at 30 listings,
// quadratic at 3,000. These keep both O(1) as the catalogue grows.

const productById = new Map(products.map((p) => [p.id, p]));

const variantIndex = new Map();
for (const product of products) {
  for (const variant of product.variants) {
    variantIndex.set(variant.id, { product, variant });
  }
}

const productsByCategory = new Map();
for (const product of products) {
  if (!productsByCategory.has(product.category)) productsByCategory.set(product.category, []);
  productsByCategory.get(product.category).push(product);
}

// --- facets ----------------------------------------------------------------
// Which filters a category offers is data, not UI logic, so adding one is a line
// here rather than a branch in the listing page.
//
//   source 'product'   value lives on the listing (brand)
//   source 'variant'   value lives on variants (storage, colour)
//   source 'bucket'    a numeric attribute grouped into ranges (screen size)
//   type   'range'     continuous min/max (price)

export const screenBuckets = [
  { id: 'compact', max: 6.4 },
  { id: 'standard', min: 6.4, max: 6.8 },
  { id: 'large', min: 6.8 }
];

export const facetsByCategory = {
  phones: [
    { id: 'price', type: 'range' },
    { id: 'brand', type: 'toggle', source: 'product', key: 'brand' },
    { id: 'storage', type: 'toggle', source: 'variant', key: 'storage' },
    { id: 'color', type: 'swatch', source: 'variant', key: 'color' },
    { id: 'screen', type: 'toggle', source: 'bucket', key: 'screen', buckets: screenBuckets }
  ]
};

export function getFacets(category) {
  return facetsByCategory[category] || [];
}

function bucketFor(value, buckets) {
  if (value === undefined || value === null) return null;
  const hit = buckets.find(
    (b) => (b.min === undefined || value >= b.min) && (b.max === undefined || value < b.max)
  );
  return hit ? hit.id : null;
}

// Every value a product contributes to a facet. A phone sold in three colours
// contributes three colour values, but counts once per value.
function valuesFor(product, facet) {
  if (facet.source === 'variant') {
    return [...new Set(product.variants.map((v) => v[facet.key]).filter(Boolean))];
  }
  if (facet.source === 'bucket') {
    const id = bucketFor(product.attributes?.[facet.key], facet.buckets);
    return id ? [id] : [];
  }
  const value = product[facet.key];
  return value === undefined || value === null ? [] : [value];
}

export function getFacetOptions(facet, list) {
  const counts = new Map();
  for (const product of list) {
    for (const value of valuesFor(product, facet)) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  const options = [...counts.entries()].map(([value, count]) => ({ value, count }));

  // Options arrive in whatever order products happened to be encountered, which
  // reads as random. Each facet gets the order a shopper expects instead.
  if (facet.source === 'bucket') {
    const order = facet.buckets.map((b) => b.id);
    return options.sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value));
  }
  if (facet.id === 'storage') {
    return options.sort((a, b) => storageBytes(a.value) - storageBytes(b.value));
  }
  // Everything else: commonest first, so the useful options surface.
  return options.sort((a, b) => b.count - a.count);
}

// "512GB" and "1TB" have to sort as sizes, not as strings — otherwise 1TB lands
// between 128GB and 256GB.
function storageBytes(label) {
  const match = String(label).match(/^([\d.]+)\s*(GB|TB)$/i);
  if (!match) return 0;
  return Number(match[1]) * (match[2].toUpperCase() === 'TB' ? 1024 : 1);
}

// Selecting several values inside one facet is an OR (128GB or 256GB); separate
// facets combine with AND.
export function productMatchesFacet(product, facet, selected) {
  if (!selected.length) return true;
  return valuesFor(product, facet).some((v) => selected.includes(String(v)));
}

// Price is continuous, so it matches when ANY variant falls inside the range
// rather than against a set of chosen values.
export function productMatchesPrice(product, range) {
  if (!range) return true;
  return product.variants.some((v) => v.price >= range[0] && v.price <= range[1]);
}

export function getPriceBounds(list) {
  const prices = list.flatMap((p) => p.variants.map((v) => v.price));
  if (!prices.length) return [0, 0];
  return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}

// --- lookups ---------------------------------------------------------------

export function getProduct(id) {
  return productById.get(id);
}

export function findVariant(variantId) {
  return variantIndex.get(variantId) || null;
}

export function getByCategory(category) {
  return productsByCategory.get(category) || [];
}

// The variant a product page should open on: the first actually in stock,
// falling back to the first only when the whole listing is sold out.
export function getDefaultVariant(product) {
  return product.variants.find((v) => v.stock > 0) || product.variants[0];
}

export function getPriceRange(product) {
  const prices = product.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function hasVariantChoice(product) {
  return product.variants.length > 1;
}

// Distinct colours offered, in declared order, for swatches on the card.
export function getProductColors(product) {
  return [...new Set(product.variants.map((v) => v.color).filter(Boolean))];
}

// A cart line is a variant, and a variant is storage AND colour. Showing only
// "256GB" hides half of what was actually bought — two lines for the same phone
// in different finishes would look like a duplicate. Callers pass the localized
// colour name in, so the data layer stays free of copy.
export function variantLabel(variant, colorName) {
  const parts = [variant.storage, colorName].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function getStorageOptions(product) {
  return [...new Set(product.variants.map((v) => v.storage).filter(Boolean))];
}

export function getTotalStock(product) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export function getRelated(id, count = 3) {
  const current = getProduct(id);
  if (!current) return [];
  const same = getByCategory(current.category).filter((p) => p.id !== id);
  if (same.length >= count) return same.slice(0, count);
  const others = products.filter((p) => p.id !== id && p.category !== current.category);
  return [...same, ...others].slice(0, count);
}

// Things that go WITH this product, as opposed to things like it.
//
// getRelated always fills from the same category first, so with 22 phones a
// phone page showed three more phones and never an accessory — the accessories
// half of the catalogue was unreachable from the vertical that drives traffic.
// This is the other half of that relationship: you have chosen the phone, here
// is what it needs.
//
// Ordered deliberately rather than by category listing order: a charger is the
// near-universal companion purchase, audio next, then the rest. Smart-home is
// excluded — a hub is not a phone accessory, and padding the strip with a weak
// suggestion makes the strong ones look arbitrary.
const COMPANION_ORDER = ['chargers', 'audio', 'accessories'];

export function getCompanions(id, count = 3) {
  const current = getProduct(id);
  if (!current || current.category !== 'phones') return [];

  return COMPANION_ORDER.flatMap((category) =>
    getByCategory(category).filter((p) => getTotalStock(p) > 0)
  ).slice(0, count);
}
