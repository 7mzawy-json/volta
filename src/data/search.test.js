import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from './products.js';
import { matchesQuery } from './search.js';

// Four accessories were renamed to the words a Kuwaiti shopper uses: كفر, سبيكر,
// مركز تحكم and بلك. Plenty of people in Kuwait still type the Egyptian or
// Levantine word, so the old names stay searchable as aliases.
test('renamed products answer to their Gulf name and their old one', () => {
  const cases = {
    'Shell Case': ['كفر', 'جراب'],
    'Arc Speaker': ['سبيكر', 'سماعة'],
    'Beam Hub': ['مركز', 'محور'],
    'Flux Smart Plug': ['بلك', 'قابس']
  };
  for (const [name, words] of Object.entries(cases)) {
    const product = products.find((p) => p.name.en === name);
    assert.ok(product, `${name} is missing from the catalogue`);
    for (const word of words) {
      assert.ok(matchesQuery(product, word), `"${word}" no longer finds ${name}`);
    }
  }
});
