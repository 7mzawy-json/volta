import { brands, categories, getPriceRange, products, screenBuckets } from './products.js';
import { colors } from './colors.js';

// Natural language in, a set of FILTERS out.
//
// A shopper types "أبغى جوال بطارية كبيرة بأقل من ٢٠٠ دينار" and a language
// model turns it into the dials this storefront already has. The model never
// chooses products, prices or specs — it only says which existing filter to
// move, and this file is the wall that enforces that.
//
// Everything below is deliberately paranoid. `validateIntent` takes whatever
// came back — a string, null, a deeply nested object, an array of ten thousand
// brands, a `price` of Infinity — and returns a clean intent or an empty one.
// It never throws, and it never passes a value through that is not already in
// this catalogue's own vocabulary. That is the whole security argument for
// letting a model near the search box: the worst it can do is filter badly.
//
// It is also why this file has no network code and no model in it. The wall is
// testable on its own, and the tests below it run without an API key.

// --- the closed vocabulary ---------------------------------------------------
// Read from the catalogue rather than typed out, so a new brand or storage tier
// becomes sayable the moment it exists, and a removed one stops being sayable.

export const SORTS = ['newest', 'price-low', 'price-high'];

export const STORAGE_VALUES = [
  ...new Set(products.flatMap((p) => p.variants.map((v) => v.storage).filter(Boolean)))
];

export const COLOR_IDS = Object.keys(colors);

export const SCREEN_BUCKETS = screenBuckets.map((b) => b.id);

// What the model is allowed to put in each list, and how many of them.
//
// The cap is not decoration: a model that returns every brand it can think of
// would otherwise build a URL long enough to be its own problem, and a filter
// that selects everything is the same as no filter with extra steps.
const LISTS = {
  brand: { allowed: brands, max: 4 },
  storage: { allowed: STORAGE_VALUES, max: 4 },
  color: { allowed: COLOR_IDS, max: 4 },
  screen: { allowed: SCREEN_BUCKETS, max: 3 }
};

// Free text still reaches the existing keyword search, so it has to be bounded
// the way any user input is.
const MAX_QUERY_CHARS = 80;

// The real floor and ceiling of the catalogue. A price filter outside them is
// not a filter, and a model asked for "cheap" will happily answer 0–999999.
export const PRICE_BOUNDS = products.reduce(
  (bounds, product) => {
    const { min, max } = getPriceRange(product);
    return [Math.min(bounds[0], min), Math.max(bounds[1], max)];
  },
  [Infinity, -Infinity]
);

// --- validation ---------------------------------------------------------------

function cleanString(value, max) {
  if (typeof value !== 'string') return '';
  // Control characters stripped: a newline in a URL parameter is somebody
  // else's bug waiting to happen.
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
}

function cleanList(value, { allowed, max }, dropped, field) {
  // One value or many — a model will produce both, and neither is wrong.
  const raw = Array.isArray(value) ? value : value == null ? [] : [value];
  const seen = new Set();
  const kept = [];

  for (const item of raw) {
    if (kept.length >= max) {
      dropped.push(`${field}:overflow`);
      break;
    }
    const id = typeof item === 'string' ? item.trim().toLowerCase() : '';
    // Storage is the one list whose ids are upper case ("256GB"), so compare
    // case-insensitively and keep the CATALOGUE's spelling, never the model's.
    const match = allowed.find((a) => a.toLowerCase() === id);
    if (!match) {
      if (item != null && item !== '') dropped.push(`${field}:${String(item).slice(0, 24)}`);
      continue;
    }
    if (seen.has(match)) continue;
    seen.add(match);
    kept.push(match);
  }

  return kept;
}

// One end of a range. `null` means "no bound on this side", which is how a model
// naturally answers "under 200 KD" — and is the only non-number accepted here.
//
// Coercing with Number() alone was a hole the tests found before any model was
// involved: Number(null), Number(''), Number(false) and Number([]) are all 0, so
// an empty string at one end would have quietly become a real price floor.
const OPEN = Symbol('open bound');

function bound(value) {
  if (value == null) return OPEN;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function cleanPrice(value, dropped) {
  if (!Array.isArray(value) || value.length !== 2) {
    if (value != null) dropped.push('price:shape');
    return null;
  }

  const low = bound(value[0]);
  const high = bound(value[1]);
  if (low === null || high === null) {
    dropped.push('price:notANumber');
    return null;
  }

  const rawLow = low === OPEN ? PRICE_BOUNDS[0] : low;
  const rawHigh = high === OPEN ? PRICE_BOUNDS[1] : high;

  // Reversed pairs are a model slip, not an attack — accept the range it meant.
  const lowest = Math.max(PRICE_BOUNDS[0], Math.min(rawLow, rawHigh));
  const highest = Math.min(PRICE_BOUNDS[1], Math.max(rawLow, rawHigh));
  if (highest <= lowest) {
    dropped.push('price:empty');
    return null;
  }

  // A range that spans the whole catalogue filters nothing; saying so out loud
  // is better than showing a shopper a price chip that does not narrow.
  if (lowest <= PRICE_BOUNDS[0] && highest >= PRICE_BOUNDS[1]) {
    dropped.push('price:wholeCatalogue');
    return null;
  }

  // Three decimals, because the dinar has three. Rounded to fils so the URL
  // never carries a price this shop could not charge.
  return [Math.round(lowest * 1000) / 1000, Math.round(highest * 1000) / 1000];
}

export const EMPTY_INTENT = {
  q: '',
  category: null,
  price: null,
  brand: [],
  storage: [],
  color: [],
  screen: [],
  sort: null
};

// Takes anything. Returns an intent this storefront can actually execute, plus
// the list of everything it refused — which is what the tests assert on, and
// what a debug view would show.
export function validateIntent(raw) {
  const dropped = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { intent: { ...EMPTY_INTENT }, dropped: raw == null ? [] : ['root:notAnObject'] };
  }

  const category = typeof raw.category === 'string' ? raw.category.trim().toLowerCase() : null;
  const sort = typeof raw.sort === 'string' ? raw.sort.trim().toLowerCase() : null;

  if (category && category !== 'all' && !categories.includes(category)) dropped.push(`category:${category.slice(0, 24)}`);
  if (sort && !SORTS.includes(sort)) dropped.push(`sort:${sort.slice(0, 24)}`);

  const intent = {
    q: cleanString(raw.q, MAX_QUERY_CHARS),
    category: categories.includes(category) ? category : null,
    price: cleanPrice(raw.price, dropped),
    brand: cleanList(raw.brand, LISTS.brand, dropped, 'brand'),
    storage: cleanList(raw.storage, LISTS.storage, dropped, 'storage'),
    color: cleanList(raw.color, LISTS.color, dropped, 'color'),
    screen: cleanList(raw.screen, LISTS.screen, dropped, 'screen'),
    sort: SORTS.includes(sort) ? sort : null
  };

  return { intent, dropped };
}

// True when the intent would actually change what the shopper sees. An intent
// that narrows nothing should fall back to the ordinary keyword search rather
// than announce that a model was consulted.
export function isUsefulIntent(intent) {
  return Boolean(
    intent.category ||
      intent.price ||
      intent.sort ||
      intent.brand.length ||
      intent.storage.length ||
      intent.color.length ||
      intent.screen.length
  );
}

// The intent as this storefront's own URL. Every key here is one the products
// page already reads — this function invents no parameters of its own.
export function intentToSearchParams(intent) {
  const params = new URLSearchParams();
  if (intent.q) params.set('q', intent.q);
  if (intent.category) params.set('category', intent.category);
  if (intent.sort) params.set('sort', intent.sort);
  if (intent.price) params.set('price', `${intent.price[0]}-${intent.price[1]}`);
  for (const field of ['brand', 'storage', 'color', 'screen']) {
    if (intent[field].length) params.set(field, intent[field].join(','));
  }
  return params;
}
