// A local stand-in for how a static host serves this site, used to check the build
// before uploading it.
//
// `vite preview` is not good enough for that job: it answers EVERY path with the
// root index.html, so the per-route heads written by prerender-meta are never
// seen and a broken deploy would look fine. A real host resolves a static file first
// and only falls back to the SPA rewrite when nothing matches, which is the
// order this reproduces:
//
//   1. exact file            /volta-social-preview.png
//   2. directory index       /products/iphone-17-pro-max -> .../index.html
//   3. SPA fallback          anything else -> /index.html with 200, per vercel.json
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
// Flags as well as env vars: `BASE=/volta node ...` is not portable to
// PowerShell or cmd, and one npm script does not justify a cross-env dependency.
function flag(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const port = Number(flag('port', process.env.PORT || 4175));
// Serve under a prefix to reproduce GitHub Pages, which puts a project repo at
// /<repo>/. Vercel serves from the root, so this defaults to empty.
const base = String(flag('base', process.env.BASE || '')).replace(/\/+$/, '');

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
  // Strip the prefix before looking on disk; anything outside it is off-site.
  let requested = pathname;
  if (base) {
    if (requested === base) requested = '/';
    else if (requested.startsWith(base + '/')) requested = requested.slice(base.length);
    else return { path: join(root, '404.html'), status: 404, offBase: true };
  }
  // normalize() collapses any ".." before it can escape dist.
  const safe = normalize(decodeURIComponent(requested)).replace(/^(\.\.[/\\])+/, '');
  const candidate = join(root, safe);
  if (!candidate.startsWith(root)) return { path: join(root, 'index.html'), status: 200 };

  const exact = await fileAt(candidate);
  if (exact) return { path: exact, status: 200 };

  const index = await fileAt(join(candidate, 'index.html'));
  if (index) return { path: index, status: 200 };

  // A rewrite-less host answers an unmatched path with 404.html and a 404 status;
  // Vercel rewrites to index.html with a 200. Mirror whichever host is being
  // imitated, so the difference shows up in testing rather than in production.
  if (base) return { path: join(root, '404.html'), status: 404, fallback: true };
  return { path: join(root, 'index.html'), status: 200, fallback: true };
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${port}`);
  const target = await resolveTarget(pathname);

  res.writeHead(target.status, {
    'content-type': TYPES[extname(target.path)] || 'application/octet-stream',
    'x-volta-served': target.offBase
      ? 'off-base'
      : target.fallback
        ? 'spa-fallback'
        : 'static-file'
  });
  createReadStream(target.path).pipe(res);
}).listen(port, () => {
  console.log(
    `  serving dist/ on http://localhost:${port}${base || ''}` +
      (base ? ' — subpath resolution (static file, then 404.html)' : ' — Vercel resolution (static file, then SPA rewrite)')
  );
});
