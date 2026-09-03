import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const bootPath = resolve(repoRoot, 'public/language-boot.js');

async function runBoot(storedLanguage, storageThrows = false) {
  const source = await readFile(bootPath, 'utf8');
  const documentElement = { lang: 'ar', dir: 'rtl' };

  vm.runInNewContext(source, {
    document: { documentElement },
    localStorage: {
      getItem() {
        if (storageThrows) throw new Error('storage unavailable');
        return storedLanguage;
      }
    }
  });

  return documentElement;
}

test('language bootstrap runs before styles and the React module', async () => {
  const html = await readFile(resolve(repoRoot, 'index.html'), 'utf8');
  const boot = html.indexOf('/language-boot.js');

  assert.notEqual(boot, -1, 'language bootstrap script is missing');
  assert.ok(boot < html.indexOf('<link'), 'bootstrap must run before stylesheet links');
  assert.ok(boot < html.indexOf('/src/main.jsx'), 'bootstrap must run before React');
});

test('persisted English applies LTR synchronously', async () => {
  assert.deepEqual(await runBoot('en'), { lang: 'en', dir: 'ltr' });
});

test('Arabic, invalid values and unavailable storage safely use RTL Arabic', async () => {
  assert.deepEqual(await runBoot('ar'), { lang: 'ar', dir: 'rtl' });
  assert.deepEqual(await runBoot('fr'), { lang: 'ar', dir: 'rtl' });
  assert.deepEqual(await runBoot(null, true), { lang: 'ar', dir: 'rtl' });
});
