// Catalog schema
// ---------------
// A product is a *listing*; the thing you actually buy is a VARIANT. Phones ship
// in several storage sizes at different prices and stock levels, so price and
// stock live on the variant, never on the product. Accessories simply carry one
// unlabelled variant, which keeps every consumer on a single code path.
//
// `attributes` holds structured, comparable values (numbers and enums, not prose)
// so filtering, sorting and a future compare view can all read the same fields.
// Accessories carry hand-written `specs`; phones derive theirs from `attributes`
// below, so a phone's spec sheet and the filters can never disagree.

import { phones } from './phones.js';

// Phones lead: it is the vertical the shop is built around.
export const categories = ['phones', 'chargers', 'audio', 'accessories', 'smart'];

export const brands = ['apple', 'samsung', 'xiaomi', 'google', 'honor', 'nothing', 'oneplus', 'volta'];

// Brand names are proper nouns and stay in Latin script in both languages —
// that is how they are printed on the boxes and typed into search.
export const brandLabels = {
  apple: 'Apple',
  samsung: 'Samsung',
  xiaomi: 'Xiaomi',
  google: 'Google',
  honor: 'Honor',
  nothing: 'Nothing',
  oneplus: 'OnePlus',
  volta: 'VOLTA'
};

const accessories = [
  {
    id: "aero-buds",
    icon: "earbuds",
    category: "audio",
    brand: "volta",
    badge: { ar: "الأكثر مبيعًا", en: "Best Seller" },
    name: { ar: "سماعات Aero", en: "Aero Buds" },
    description: {
      ar: "سماعات لاسلكية بعزل ضوضاء نشط وصوت نظيف من كل الاتجاهات.",
      en: "Wireless earbuds with active noise cancellation and clean, directional sound."
    },
    attributes: { anc: true, batteryHours: 28, waterResistance: "IPX4", connection: "wireless" },
    specs: {
      ar: ["عزل ضوضاء نشط", "بطارية تدوم 28 ساعة مع العلبة", "مقاومة للماء IPX4"],
      en: ["Active noise cancellation", "28-hour battery with case", "IPX4 water resistance"]
    },
    variants: [{ id: "aero-buds", label: null, price: 26.9, stock: 14 }]
  },
  {
    id: "volt-pad",
    icon: "chargepad",
    category: "chargers",
    brand: "volta",
    name: { ar: "قاعدة شحن Volt", en: "Volt Pad" },
    description: {
      ar: "شحن لاسلكي سريع بتصميم رفيع يناسب أي مكتب.",
      en: "Fast wireless charging in a slim profile that fits any desk."
    },
    attributes: { wattage: 15, connection: "wireless" },
    specs: {
      ar: ["شحن سريع 15 واط", "يوقف الشحن تلقائيًا عند الاكتمال", "قاعدة مانعة للانزلاق"],
      en: ["15W fast charging", "Auto-stop at full charge", "Non-slip base"]
    },
    variants: [{ id: "volt-pad", label: null, price: 12.5, stock: 22 }]
  },
  {
    id: "core-bank",
    icon: "powerbank",
    category: "chargers",
    brand: "volta",
    name: { ar: "بطارية Core 10K", en: "Core Bank 10K" },
    description: {
      ar: "بطارية محمولة بسعة 10000 مللي أمبير، تشحن هاتفك مرتين كاملتين.",
      en: "A 10,000mAh power bank that fully charges your phone twice over."
    },
    attributes: { capacity: 10000, wattage: 20, ports: 2, connection: "wired" },
    specs: {
      ar: ["سعة 10000mAh", "منفذ USB-C بشحن سريع", "حجم يدخل الجيب"],
      en: ["10,000mAh capacity", "USB-C fast charge port", "Pocket-sized"]
    },
    variants: [{ id: "core-bank", label: null, price: 9.9, stock: 31 }]
  },
  {
    id: "pulse-watch",
    icon: "watch",
    category: "smart",
    brand: "volta",
    badge: { ar: "جديد", en: "New" },
    name: { ar: "ساعة Pulse", en: "Pulse Watch" },
    description: {
      ar: "ساعة ذكية تراقب نبضك ونومك وتتزامن مع هاتفك بسلاسة.",
      en: "A smartwatch that tracks heart rate and sleep, synced seamlessly to your phone."
    },
    attributes: { batteryDays: 6, display: "AMOLED", heartRate: true, connection: "wireless" },
    specs: {
      ar: ["مراقبة نبض القلب", "بطارية تدوم 6 أيام", "شاشة AMOLED"],
      en: ["Heart rate monitoring", "6-day battery life", "AMOLED display"]
    },
    variants: [{ id: "pulse-watch", label: null, price: 39.9, stock: 8 }]
  },
  {
    id: "nova-keys",
    icon: "keyboard",
    category: "accessories",
    brand: "volta",
    name: { ar: "لوحة مفاتيح Nova", en: "Nova Keys" },
    description: {
      ar: "لوحة مفاتيح ميكانيكية لاسلكية بإضاءة خلفية قابلة للتخصيص.",
      en: "A wireless mechanical keyboard with customizable backlighting."
    },
    attributes: { switches: "mechanical", backlight: true, connection: "wireless" },
    specs: {
      ar: ["مفاتيح ميكانيكية", "اتصال لاسلكي وسلكي", "إضاءة خلفية RGB"],
      en: ["Mechanical switches", "Wireless + wired connection", "RGB backlighting"]
    },
    variants: [{ id: "nova-keys", label: null, price: 29.9, stock: 6 }]
  },
  {
    id: "arc-speaker",
    icon: "speaker",
    category: "audio",
    brand: "volta",
    name: { ar: "سماعة Arc", en: "Arc Speaker" },
    description: {
      ar: "سماعة بلوتوث مقاومة للماء بصوت قوي يناسب أي مكان.",
      en: "A water-resistant Bluetooth speaker with powerful sound for anywhere."
    },
    attributes: { batteryHours: 12, waterResistance: "IPX6", connection: "wireless" },
    specs: {
      ar: ["مقاومة للماء IPX6", "بطارية تدوم 12 ساعة", "اقتران بلوتوث فوري"],
      en: ["IPX6 water resistance", "12-hour battery", "Instant Bluetooth pairing"]
    },
    variants: [{ id: "arc-speaker", label: null, price: 21.9, stock: 0 }]
  },
  {
    id: "grip-stand",
    icon: "stand",
    category: "accessories",
    brand: "volta",
    name: { ar: "حامل Grip", en: "Grip Stand" },
    description: {
      ar: "حامل قابل للطي للهاتف واللابتوب، خفيف ويناسب السفر.",
      en: "A foldable stand for phone and laptop — light enough to travel with."
    },
    attributes: { foldable: true, material: "aluminum" },
    specs: {
      ar: ["يطوى بالكامل", "يناسب الهاتف واللابتوب", "قاعدة ألمنيوم متينة"],
      en: ["Fully foldable", "Fits phone and laptop", "Durable aluminum base"]
    },
    variants: [{ id: "grip-stand", label: null, price: 6.9, stock: 40 }]
  },
  {
    id: "beam-hub",
    icon: "hub",
    category: "smart",
    brand: "volta",
    name: { ar: "محور Beam", en: "Beam Hub" },
    description: {
      ar: "محور منزل ذكي يربط أجهزتك كلها بتطبيق واحد.",
      en: "A smart home hub that connects all your devices in one app."
    },
    attributes: { protocols: "wifi-bluetooth", connection: "wireless" },
    specs: {
      ar: ["يدعم Wi-Fi و Bluetooth", "يتحكم بعدد غير محدود من الأجهزة", "إعداد خلال دقيقتين"],
      en: ["Wi-Fi + Bluetooth support", "Unlimited connected devices", "2-minute setup"]
    },
    variants: [{ id: "beam-hub", label: null, price: 18.9, stock: 11 }]
  }
];

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

export const products = [
  ...phones.map((p) => ({ ...p, specs: p.specs || deriveSpecs(p.attributes) })),
  ...accessories
];

// --- facets ----------------------------------------------------------------
// Which filters a category offers is data, not UI logic, so adding a facet is a
// one-line change here rather than a new branch in the listing page.
// `source: 'variant'` means the values live on variants (storage) rather than on
// the product itself.

export const facetsByCategory = {
  phones: [
    { id: 'brand', source: 'product', key: 'brand' },
    { id: 'storage', source: 'variant', key: 'label' },
    { id: 'ram', source: 'attribute', key: 'ram', suffix: 'GB' },
    { id: 'network', source: 'attribute', key: 'network' }
  ]
};

export function getFacets(category) {
  return facetsByCategory[category] || [];
}

// Collects the distinct values a facet can take, with a count of how many
// listings carry each, so the UI can show counts and hide options that match
// nothing at all.
export function getFacetOptions(facet, list) {
  const counts = new Map();
  for (const product of list) {
    const values =
      facet.source === 'variant'
        ? [...new Set(product.variants.map((v) => (v.label ? v.label.en : null)).filter(Boolean))]
        : facet.source === 'attribute'
          ? [product.attributes?.[facet.key]]
          : [product[facet.key]];
    for (const value of values) {
      if (value === undefined || value === null) continue;
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }
  return [...counts.entries()].map(([value, count]) => ({ value, count }));
}

// Does one product satisfy one facet's selected values? Selecting several values
// within a facet is an OR (128GB or 256GB), which is what shoppers expect.
export function productMatchesFacet(product, facet, selected) {
  if (!selected.length) return true;
  if (facet.source === 'variant') {
    return product.variants.some((v) => v.label && selected.includes(v.label.en));
  }
  const value = facet.source === 'attribute' ? product.attributes?.[facet.key] : product[facet.key];
  return selected.includes(String(value));
}

// --- lookups ---------------------------------------------------------------

export function getProduct(id) {
  return products.find((p) => p.id === id);
}

// Variant ids are globally unique, so a cart line needs to store only one id.
export function findVariant(variantId) {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

// The variant a product page should open on: the first one actually in stock,
// falling back to the first variant only when the whole listing is sold out.
export function getDefaultVariant(product) {
  return product.variants.find((v) => v.stock > 0) || product.variants[0];
}

export function getPriceRange(product) {
  const prices = product.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// True when the shopper has a real choice to make, so the UI knows whether to
// render a variant selector and a "from" price.
export function hasVariantChoice(product) {
  return product.variants.length > 1;
}

export function getTotalStock(product) {
  return product.variants.reduce((sum, v) => sum + v.stock, 0);
}

export function getRelated(id, count = 3) {
  const current = getProduct(id);
  if (!current) return [];
  const same = products.filter((p) => p.id !== id && p.category === current.category);
  const others = products.filter((p) => p.id !== id && p.category !== current.category);
  return [...same, ...others].slice(0, count);
}
