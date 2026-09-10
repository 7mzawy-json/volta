import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDocumentMetadata } from './documentMetadata.js';

const ORIGIN = 'https://volta.example';

test('home metadata is bilingual and localized for Kuwait', () => {
  const ar = resolveDocumentMetadata({ pathname: '/', lang: 'ar', origin: ORIGIN });
  const en = resolveDocumentMetadata({ pathname: '/', lang: 'en', origin: ORIGIN });

  assert.equal(ar.title, 'فولتا — اشحن طاقتك');
  assert.equal(ar.locale, 'ar_KW');
  assert.equal(ar.alternateLocale, 'en_KW');
  assert.match(ar.description, /هواتف/);

  assert.equal(en.title, 'VOLTA — Power Up');
  assert.equal(en.locale, 'en_KW');
  assert.equal(en.alternateLocale, 'ar_KW');
  assert.match(en.description, /phones/i);
});

test('every storefront route receives a distinct title and description', () => {
  const paths = ['/', '/products', '/cart', '/checkout', '/confirmation', '/wishlist', '/compare', '/missing'];
  const metadata = paths.map((pathname) => resolveDocumentMetadata({ pathname, lang: 'en', origin: ORIGIN }));

  assert.equal(new Set(metadata.map((entry) => entry.title)).size, paths.length);
  for (const entry of metadata) {
    assert.ok(entry.description.length >= 40, `${entry.title} needs a useful description`);
    assert.equal(new URL(entry.canonicalUrl).origin, ORIGIN);
  }
});

test('product metadata exposes localized Product, Offer and Breadcrumb JSON-LD', () => {
  const metadata = resolveDocumentMetadata({
    pathname: '/products/iphone-17-pro-max',
    lang: 'en',
    origin: ORIGIN
  });
  const product = metadata.structuredData.find((entry) => entry['@type'] === 'Product');
  const breadcrumbs = metadata.structuredData.find((entry) => entry['@type'] === 'BreadcrumbList');

  assert.equal(metadata.title, 'iPhone 17 Pro Max | VOLTA');
  assert.equal(metadata.type, 'product');
  assert.equal(metadata.canonicalUrl, `${ORIGIN}/products/iphone-17-pro-max`);
  assert.equal(product.brand.name, 'Apple');
  assert.equal(product.offers.length, 9);
  assert.ok(product.offers.some((offer) => offer.availability.endsWith('/OutOfStock')));

  for (const offer of product.offers) {
    assert.equal(offer.priceCurrency, 'KWD');
    assert.match(offer.price, /^\d[\d,]*\.\d{3}$/);
    assert.equal(offer.url, metadata.canonicalUrl);
  }

  assert.deepEqual(
    breadcrumbs.itemListElement.map((item) => [item.position, item.name]),
    [[1, 'Home'], [2, 'Products'], [3, 'iPhone 17 Pro Max']]
  );
});

test('social preview is a real 1200 by 630 PNG', async () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const png = await readFile(resolve(repoRoot, 'public/volta-social-preview.png'));

  assert.deepEqual([...png.subarray(1, 4)], [80, 78, 71]);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

// A subpath host serves a project from /<repo>/, Vercel from the root. The
// same build code has to produce correct absolute URLs on both, so the base is
// a parameter rather than an assumption.

test('the default base keeps URLs at the origin root', () => {
  const m = resolveDocumentMetadata({ pathname: '/products', lang: 'ar', origin: ORIGIN });

  assert.equal(m.canonicalUrl, `${ORIGIN}/products`);
  assert.equal(m.imageUrl, `${ORIGIN}/volta-social-preview.png`);
});

test('a subpath base is applied to every absolute URL', () => {
  const m = resolveDocumentMetadata({
    pathname: '/products/iphone-17-pro-max',
    lang: 'ar',
    origin: ORIGIN,
    base: '/volta/'
  });

  assert.equal(m.canonicalUrl, `${ORIGIN}/volta/products/iphone-17-pro-max`);
  assert.equal(m.imageUrl, `${ORIGIN}/volta/volta-social-preview.png`);

  // Structured data is the easy one to forget: the breadcrumb items are built
  // separately from the canonical URL and would 404 without the prefix.
  const breadcrumbs = m.structuredData.find((node) => node['@type'] === 'BreadcrumbList');
  assert.deepEqual(
    breadcrumbs.itemListElement.map((i) => i.item),
    [
      `${ORIGIN}/volta/`,
      `${ORIGIN}/volta/products`,
      `${ORIGIN}/volta/products/iphone-17-pro-max`
    ]
  );
  assert.equal(m.structuredData[0].offers[0].url, `${ORIGIN}/volta/products/iphone-17-pro-max`);
});

test('a base without its trailing slash still joins cleanly', () => {
  const m = resolveDocumentMetadata({ pathname: '/compare', lang: 'en', origin: ORIGIN, base: '/volta' });

  assert.equal(m.canonicalUrl, `${ORIGIN}/volta/compare`);
});
