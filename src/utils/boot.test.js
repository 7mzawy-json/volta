import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const bootPath = resolve(repoRoot, 'public/boot.js');

// A documentElement stand-in that records the theme attribute the way a browser
// would, so "removed" and "set to light" cannot be confused for each other.
function fakeRoot() {
  const attributes = new Map();
  return {
    lang: 'ar',
    dir: 'rtl',
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    }
  };
}

async function runBoot({ language = null, theme = null, storageThrows = false } = {}) {
  const source = await readFile(bootPath, 'utf8');
  const documentElement = fakeRoot();

  vm.runInNewContext(source, {
    document: { documentElement },
    localStorage: {
      getItem(key) {
        if (storageThrows) throw new Error('storage unavailable');
        if (key === 'volta-lang') return language;
        if (key === 'volta-theme') return theme;
        return null;
      }
    }
  });

  return {
    lang: documentElement.lang,
    dir: documentElement.dir,
    theme: documentElement.getAttribute('data-theme')
  };
}

test('the bootstrap runs before styles and the React module', async () => {
  const html = await readFile(resolve(repoRoot, 'index.html'), 'utf8');
  const boot = html.indexOf('/boot.js');

  assert.notEqual(boot, -1, 'bootstrap script is missing');
  // Both assertions are the point of the file: after the stylesheet the page
  // paints light first, and after React it paints twice.
  assert.ok(boot < html.indexOf('<link'), 'bootstrap must run before stylesheet links');
  assert.ok(boot < html.indexOf('/src/main.jsx'), 'bootstrap must run before React');
});

test('persisted English applies LTR synchronously', async () => {
  const { lang, dir } = await runBoot({ language: 'en' });
  assert.deepEqual({ lang, dir }, { lang: 'en', dir: 'ltr' });
});

test('Arabic, invalid values and unavailable storage safely use RTL Arabic', async () => {
  for (const language of ['ar', 'fr', null]) {
    const { lang, dir } = await runBoot({ language });
    assert.deepEqual({ lang, dir }, { lang: 'ar', dir: 'rtl' });
  }
  const { lang, dir } = await runBoot({ storageThrows: true });
  assert.deepEqual({ lang, dir }, { lang: 'ar', dir: 'rtl' });
});

test('the first visit is dark, before React has run', async () => {
  assert.equal((await runBoot()).theme, 'dark');
  // Nothing to read is the same as nothing stored.
  assert.equal((await runBoot({ theme: 'chartreuse' })).theme, 'dark');
  assert.equal((await runBoot({ storageThrows: true })).theme, 'dark');
});

test('a stored choice wins, and light is an absent attribute rather than a value', async () => {
  assert.equal((await runBoot({ theme: 'dark' })).theme, 'dark');
  // Not 'light': the stylesheet's bare :root IS light, and stamping the
  // attribute anyway would give the default two sources of truth.
  assert.equal((await runBoot({ theme: 'light' })).theme, null);
});
