// Post-build step: write one static HTML file per route, each with its own
// title, description, canonical URL and Open Graph tags.
//
// Netlify serves a matching static file before it consults _redirects, so
// /products/iphone-17-pro-max/index.html is what a scraper gets for that link,
// while anything unmatched still falls through the SPA rewrite to the root
// index.html. Every file loads the identical bundle — only the head differs.
//
// Needs VITE_SITE_ORIGIN, because an absolute URL cannot be guessed. Without it
// this exits without touching the build and says so, rather than baking in a
// wrong origin that would point every preview at somebody else's site.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { products } from '../src/data/products.js';
import { resolveDocumentMetadata } from '../src/utils/documentMetadata.js';
import { loadEnv } from 'vite';
import { assertAbsolute, renderHead } from './socialHead.js';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, '..');
const dist = resolve(projectRoot, 'dist');

// loadEnv so a value set once in .env behaves the same as one passed inline,
// which is how the rest of the toolchain reads configuration.
const env = loadEnv(process.env.NODE_ENV || 'production', projectRoot, '');
const origin = (process.env.VITE_SITE_ORIGIN || env.VITE_SITE_ORIGIN || '')
  .trim()
  .replace(/\/+$/, '');

// GitHub Pages serves a project repo under /<repo>/. Must match the base Vite
// was built with, or the head advertises URLs the host does not serve.
const rawBase = (process.env.VITE_BASE || env.VITE_BASE || '/').trim();
const base = rawBase.startsWith('/') ? rawBase : `/${rawBase}`;

if (!origin) {
  console.warn(
    '\n  prerender-meta: VITE_SITE_ORIGIN is not set, so link previews will show a\n' +
      '  relative "/" instead of the real URL. Set it and build again:\n\n' +
      '    VITE_SITE_ORIGIN=https://your-site.netlify.app npm run build\n'
  );
  process.exit(0);
}

if (!/^\/([A-Za-z0-9._~-]+\/)*$/.test(base)) {
  console.error(
    `\n  prerender-meta: VITE_BASE must look like "/" or "/volta/" — got "${base}".\n`
  );
  process.exit(1);
}

if (!/^https?:\/\/[^/]+$/.test(origin)) {
  console.error(
    `\n  prerender-meta: VITE_SITE_ORIGIN must be a bare origin like\n` +
      `  https://volta.netlify.app — got "${origin}".\n`
  );
  process.exit(1);
}

// Routes worth their own preview. Cart, checkout and confirmation are excluded
// deliberately: they describe one person's session, they are not shareable, and
// giving them polished previews would only invite sharing them.
const routes = [
  '/',
  '/products',
  '/wishlist',
  '/compare',
  ...products.map((product) => `/products/${product.id}`)
];

const template = await readFile(join(dist, 'index.html'), 'utf8');

let written = 0;
for (const route of routes) {
  const metadata = resolveDocumentMetadata({ pathname: route, lang: 'ar', origin, base });
  const html = renderHead(template, metadata);
  assertAbsolute(html, route);

  const target = route === '/' ? join(dist, 'index.html') : join(dist, route.slice(1), 'index.html');
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
  written += 1;
}

// GitHub Pages has no rewrite rules — it serves 404.html for anything it cannot
// match to a file. Making that a copy of the site's own entry page turns Pages'
// 404 into the SPA fallback that public/_redirects provides on Netlify, so a
// deep link that is not one of the prerendered routes still boots the app and
// lets React Router render the storefront's own 404.
const fallback = renderHead(
  template,
  resolveDocumentMetadata({ pathname: '/', lang: 'ar', origin, base })
);
await writeFile(join(dist, '404.html'), fallback, 'utf8');

console.log(
  `  prerender-meta: ${written} routes + 404.html given their own head at ${origin}${base}`
);
