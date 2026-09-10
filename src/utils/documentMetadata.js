import { copy } from '../data/copy.js';
import { brandLabels, getProduct } from '../data/products.js';
import { formatPriceValue } from './currency.js';

const LOCALES = {
  ar: { current: 'ar_KW', alternate: 'en_KW' },
  en: { current: 'en_KW', alternate: 'ar_KW' }
};

// Join the site's base path onto a route before resolving it against the
// origin. Under Vercel base is '/' and this is a no-op; under a subpath deploy it
// is '/volta/', and without it every canonical and og:url would advertise a URL
// that 404s.
function siteUrl(path, origin, base) {
  const prefix = (base || '/').replace(/\/+$/, '');
  return new URL(prefix + path, origin).toString();
}

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function pageText(pathname, t) {
  const pages = {
    '/': { title: `${t.brand} — ${t.tagline}`, description: t.hero.subtitle },
    '/products': { title: `${t.nav.products} | ${t.brand}`, description: t.meta.products },
    '/cart': { title: `${t.cart.title} | ${t.brand}`, description: t.meta.cart },
    '/checkout': { title: `${t.checkout.title} | ${t.brand}`, description: t.meta.checkout },
    '/confirmation': { title: `${t.confirmation.title} | ${t.brand}`, description: t.meta.confirmation },
    '/wishlist': { title: `${t.nav.wishlist} | ${t.brand}`, description: t.meta.wishlist },
    '/compare': { title: `${t.compare.title} | ${t.brand}`, description: t.meta.compare },
    '/login': { title: `${t.account.signIn} | ${t.brand}`, description: t.meta.login },
    '/signup': { title: `${t.account.signUp} | ${t.brand}`, description: t.meta.signup },
    '/orders': { title: `${t.orders.title} | ${t.brand}`, description: t.meta.orders },
    '/profile': { title: `${t.profile.title} | ${t.brand}`, description: t.meta.profile }
  };

  return pages[pathname] || {
    title: `${t.notFound.title} | ${t.brand}`,
    description: t.meta.notFound
  };
}

function productFromPath(pathname) {
  const match = /^\/products\/([^/]+)$/.exec(pathname);
  if (!match) return null;

  try {
    return getProduct(decodeURIComponent(match[1])) || null;
  } catch {
    return null;
  }
}

function productStructuredData({ product, lang, t, canonicalUrl, origin, base }) {
  const productName = product.name[lang];
  const productNode = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: productName,
    description: product.description[lang],
    sku: product.id,
    category: t.categories[product.category],
    brand: {
      '@type': 'Brand',
      name: brandLabels[product.brand]
    },
    offers: product.variants.map((variant) => ({
      '@type': 'Offer',
      sku: variant.id,
      url: canonicalUrl,
      priceCurrency: 'KWD',
      price: formatPriceValue(variant.price),
      availability: variant.stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    }))
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.nav.home, item: siteUrl('/', origin, base) },
      { '@type': 'ListItem', position: 2, name: t.nav.products, item: siteUrl('/products', origin, base) },
      { '@type': 'ListItem', position: 3, name: productName, item: canonicalUrl }
    ]
  };

  return [productNode, breadcrumbs];
}

export function resolveDocumentMetadata({ pathname, lang = 'ar', origin, base = '/' }) {
  const activeLang = lang === 'en' ? 'en' : 'ar';
  const t = copy[activeLang];
  const path = normalizePath(pathname);
  const product = productFromPath(path);
  const fallbackPath = /^\/products\//.test(path) && !product ? '/products' : path;
  const page = product
    ? { title: `${product.name[activeLang]} | ${t.brand}`, description: product.description[activeLang] }
    : pageText(fallbackPath, t);
  const canonicalUrl = siteUrl(product ? path : fallbackPath, origin, base);
  const imageUrl = siteUrl('/volta-social-preview.png', origin, base);
  const locale = LOCALES[activeLang];

  return {
    ...page,
    canonicalUrl,
    locale: locale.current,
    alternateLocale: locale.alternate,
    type: product ? 'product' : 'website',
    siteName: t.brand,
    imageUrl,
    imageAlt: t.meta.socialImageAlt,
    structuredData: product
      ? productStructuredData({ product, lang: activeLang, t, canonicalUrl, origin, base })
      : []
  };
}
