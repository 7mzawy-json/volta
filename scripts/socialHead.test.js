import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAbsolute, renderHead } from './socialHead.js';
import { resolveDocumentMetadata } from '../src/utils/documentMetadata.js';

const ORIGIN = 'https://volta.example';

// A trimmed stand-in for the built index.html, carrying the tags that matter.
const TEMPLATE = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="home description" />
    <meta property="og:title" content="home title" />
    <meta property="og:description" content="home description" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="/" />
    <meta property="og:site_name" content="فولتا" />
    <meta property="og:locale" content="ar_KW" />
    <meta property="og:locale:alternate" content="en_KW" />
    <meta property="og:image" content="/volta-social-preview.png" />
    <meta property="og:image:alt" content="alt" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="home title" />
    <meta name="twitter:description" content="home description" />
    <meta name="twitter:image" content="/volta-social-preview.png" />
    <meta name="twitter:image:alt" content="alt" />
    <link rel="canonical" href="/" />
    <title>VOLTA</title>
  </head>
  <body><div id="root"></div></body>
</html>`;

const headOf = (route) =>
  renderHead(TEMPLATE, resolveDocumentMetadata({ pathname: route, lang: 'ar', origin: ORIGIN }));

test('every social URL becomes absolute', () => {
  const html = headOf('/products');

  assert.match(html, /<meta property="og:url" content="https:\/\/volta\.example\/products"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/volta\.example\/products"/);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/volta\.example\/volta-social-preview\.png"/
  );
  assert.match(
    html,
    /<meta name="twitter:image" content="https:\/\/volta\.example\/volta-social-preview\.png"/
  );
  assert.doesNotThrow(() => assertAbsolute(html, '/products'));
});

test('a product route describes the product, not the homepage', () => {
  const html = headOf('/products/iphone-17-pro-max');

  assert.match(html, /<title>iPhone 17 Pro Max \| فولتا<\/title>/);
  assert.match(
    html,
    /<meta property="og:url" content="https:\/\/volta\.example\/products\/iphone-17-pro-max"/
  );
  assert.match(html, /<meta property="og:type" content="product"/);
  // The whole point: the shared link and the advertised link agree.
  const url = /<meta property="og:url" content="([^"]+)"/.exec(html)[1];
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)[1];
  assert.equal(url, canonical);
});

test('product pages carry structured data, other pages do not', () => {
  const product = headOf('/products/iphone-17-pro-max');
  const listing = headOf('/products');

  const block = /<script type="application\/ld\+json" id="volta-structured-data">([\s\S]*?)<\/script>/.exec(
    product
  );
  assert.ok(block, 'product page should embed JSON-LD');
  const parsed = JSON.parse(block[1].replace(/\\u003c/g, '<'));
  assert.deepEqual(
    parsed.map((node) => node['@type']),
    ['Product', 'BreadcrumbList']
  );
  assert.equal(parsed[0].offers[0].priceCurrency, 'KWD');

  assert.doesNotMatch(listing, /id="volta-structured-data"/);
});

test('rendering twice does not stack duplicate structured data', () => {
  const once = headOf('/products/iphone-17-pro-max');
  const twice = renderHead(
    once,
    resolveDocumentMetadata({
      pathname: '/products/iphone-17-pro-max',
      lang: 'ar',
      origin: ORIGIN
    })
  );

  const count = (twice.match(/id="volta-structured-data"/g) || []).length;
  assert.equal(count, 1);
});

test('a head that failed to substitute is rejected rather than shipped', () => {
  assert.throws(() => assertAbsolute(TEMPLATE, '/'), /still relative/);
});

test('quotes in metadata cannot break out of an attribute', () => {
  const html = renderHead(TEMPLATE, {
    title: 'a "quoted" title',
    description: 'ends with " and <script>',
    type: 'website',
    canonicalUrl: `${ORIGIN}/`,
    siteName: 'VOLTA',
    locale: 'ar_KW',
    alternateLocale: 'en_KW',
    imageUrl: `${ORIGIN}/volta-social-preview.png`,
    imageAlt: 'alt',
    structuredData: []
  });

  assert.match(html, /<meta property="og:title" content="a &quot;quoted&quot; title"/);
  assert.doesNotMatch(html, /content="[^"]*<script>/);
});
