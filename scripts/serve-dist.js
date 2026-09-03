// A local stand-in for how Netlify serves this site, used to check the build
// before uploading it.
//
// `vite preview` is not good enough for that job: it answers EVERY path with the
// root index.html, so the per-route heads written by prerender-meta are never
// seen and a broken deploy would look fine. Netlify resolves a static file first
// and only falls back to the SPA rewrite when nothing matches, which is the
// order this reproduces:
//
//   1. exact file            /volta-social-preview.png
//   2. directory index       /products/iphone-17-pro-max -> .../index.html
//   3. SPA fallback          anything else -> /index.html with 200, per _redirects
//
// Point a scraper-shaped request at it (plain fetch, no JavaScript) and what
// comes back is what a link preview will be built from.

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', 'dist');
const port = Number(process.env.PORT || 4175);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

async function fileAt(path) {
  try {
    const info = await stat(path);
    return info.isFile() ? path : null;
  } catch {
    return null;
  }
}

async function resolveTarget(pathname) {
  // normalize() collapses any ".." before it can escape dist.
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(root, safe);
  if (!candidate.startsWith(root)) return { path: join(root, 'index.html'), status: 200 };

  const exact = await fileAt(candidate);
  if (exact) return { path: exact, status: 200 };

  const index = await fileAt(join(candidate, 'index.html'));
  if (index) return { path: index, status: 200 };

  return { path: join(root, 'index.html'), status: 200, fallback: true };
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${port}`);
  const target = await resolveTarget(pathname);

  res.writeHead(target.status, {
    'content-type': TYPES[extname(target.path)] || 'application/octet-stream',
    'x-volta-served': target.fallback ? 'spa-fallback' : 'static-file'
  });
  createReadStream(target.path).pipe(res);
}).listen(port, () => {
  console.log(`  serving dist/ with Netlify-like resolution on http://localhost:${port}`);
});
