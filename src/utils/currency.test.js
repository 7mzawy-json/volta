import test from 'node:test';
import assert from 'node:assert/strict';
import { convert, formatPrice, formatPriceValue } from './currency.js';
import { BASE_CURRENCY, currencies, getCurrency } from '../data/currencies.js';

test('the dinar keeps its three decimals in both languages', () => {
  assert.equal(formatPrice(389.9, 'ar'), '389.900 د.ك');
  assert.equal(formatPrice(389.9, 'en'), '389.900 KD');
  assert.equal(formatPrice(0.5, 'en'), '0.500 KD');
  assert.equal(formatPrice(1234.5, 'en'), '1,234.500 KD');
});

// The whole reason this is a table and not a multiplier: three Gulf currencies
// subdivide into 1000, not 100. Showing a Bahraini dinar to two places would be
// wrong money.
test('dinar-family currencies use three decimals, the rest two', () => {
  const places = Object.fromEntries(currencies.map((c) => [c.code, c.decimals]));

  assert.deepEqual(
    { KWD: places.KWD, BHD: places.BHD, OMR: places.OMR },
    { KWD: 3, BHD: 3, OMR: 3 }
  );
  for (const code of ['SAR', 'AED', 'QAR', 'EUR', 'USD']) {
    assert.equal(places[code], 2, `${code} should format to two decimals`);
  }
});

test('every currency renders its own decimals and label', () => {
  for (const currency of currencies) {
    const out = formatPrice(100, 'en', currency.code);
    const [value, label] = out.split(' ');
    const decimals = (value.split('.')[1] || '').length;

    assert.equal(decimals, currency.decimals, `${currency.code} rendered "${out}"`);
    assert.equal(label, currency.symbol.en);
  }
});

test('conversion is per one dinar, and the base is untouched', () => {
  assert.equal(convert(10, 'KWD'), 10);
  assert.equal(convert(1, 'USD'), getCurrency('USD').rate);
  // A hundred dinar is a few hundred dollars, not a few dollars — guards
  // against the rate being inverted, which is the classic mistake here.
  assert.ok(convert(100, 'USD') > 300 && convert(100, 'USD') < 400);
  assert.ok(convert(100, 'SAR') > 1200 && convert(100, 'SAR') < 1300);
});

test('an unknown currency falls back to the dinar rather than throwing', () => {
  assert.equal(formatPrice(10, 'en', 'XYZ'), '10.000 KD');
  assert.equal(formatPrice(10, 'en', undefined), '10.000 KD');
  assert.equal(getCurrency('XYZ').code, BASE_CURRENCY);
});

// Summing in dinar and converting once is what keeps a converted subtotal equal
// to the sum of converted lines. Converting each line first would let rounding
// drift, and a cart whose total is a cent off its lines looks broken.
test('converting the sum equals summing in dinar then converting', () => {
  const lines = [389.9, 26.9, 12.5, 4.75];
  const subtotal = lines.reduce((a, b) => a + b, 0);

  for (const code of currencies.map((c) => c.code)) {
    const asOneConversion = formatPrice(subtotal, 'en', code);
    const rounded = Number(convert(subtotal, code).toFixed(getCurrency(code).decimals));
    assert.equal(asOneConversion.split(' ')[0].replace(/,/g, ''), rounded.toFixed(getCurrency(code).decimals));
  }
});

// The JSON-LD offers declare priceCurrency KWD because that is what the shop
// charges. If this ever starts following the display currency, the structured
// data starts lying.
test('structured-data prices ignore the display currency entirely', () => {
  assert.equal(formatPriceValue(389.9), '389.900');
  assert.equal(formatPriceValue.length, 1, 'formatPriceValue must not take a currency');
});

test('every currency is fully described', () => {
  for (const c of currencies) {
    assert.match(c.code, /^[A-Z]{3}$/);
    assert.ok(c.rate > 0, `${c.code} needs a positive rate`);
    assert.ok(c.symbol.ar && c.symbol.en, `${c.code} needs both symbols`);
    assert.ok(c.name.ar && c.name.en, `${c.code} needs both names`);
  }
  // The six GCC states plus the two international currencies asked for.
  assert.deepEqual(
    currencies.map((c) => c.code),
    ['KWD', 'SAR', 'AED', 'QAR', 'BHD', 'OMR', 'EUR', 'USD']
  );
});
