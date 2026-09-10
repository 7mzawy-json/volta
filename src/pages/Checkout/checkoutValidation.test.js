import test from 'node:test';
import assert from 'node:assert/strict';
import { copy } from '../../data/copy.js';
import { validateCheckout } from './checkoutValidation.js';

// Kuwaiti address shape: governorate + block + street + building, not a western
// "street address, city" pair.
const validForm = {
  fullName: 'Noura Al-Sabah',
  governorate: 'capital',
  city: 'Kuwait City',
  block: '3',
  street: '40',
  building: '12A',
  details: '',
  phone: '+965 5555-1234'
};

const FIELDS = ['fullName', 'governorate', 'city', 'block', 'street', 'building', 'phone'];

test('a fully valid Kuwaiti address passes', () => {
  assert.deepEqual(validateCheckout(validForm), {});
});

test('returns stable error codes that can be translated at render time', () => {
  const errors = validateCheckout({ ...validForm, fullName: '' });

  assert.equal(errors.fullName, 'required');
  assert.equal(copy.en.errors[errors.fullName], 'This field is required');
  assert.equal(copy.ar.errors[errors.fullName], 'هذي الخانة مطلوبة');
});

test('every error code has copy in both languages', () => {
  const emptyForm = Object.fromEntries(Object.keys(validForm).map((key) => [key, '']));
  const codes = new Set([
    ...Object.values(validateCheckout(emptyForm)),
    ...Object.values(validateCheckout({ ...validForm, governorate: 'atlantis', phone: 'abc' })),
    ...Object.values(validateCheckout({ ...validForm, block: 'x'.repeat(30) }))
  ]);

  for (const code of codes) {
    assert.ok(copy.en.errors[code], `missing English copy for "${code}"`);
    assert.ok(copy.ar.errors[code], `missing Arabic copy for "${code}"`);
  }
});

// The whole address, and nothing but the address.
//
// This used to take a `payment` argument and validate a card number, expiry and
// CVC behind it. Those belonged to demo payment methods that took a made-up card
// and recorded nothing; Stripe collects the card on its own hosted page, so
// nothing here should ever ask for one. If a card field reappears in this list,
// something has grown a payment form it should not have.
test('every required field is reported, and only address fields', () => {
  const emptyForm = Object.fromEntries(Object.keys(validForm).map((key) => [key, '']));
  assert.deepEqual(Object.keys(validateCheckout(emptyForm)), FIELDS);
});

test('governorate must be one of the six, not merely non-empty', () => {
  assert.equal(validateCheckout({ ...validForm, governorate: 'atlantis' }).governorate, 'governorate');
  assert.equal(validateCheckout({ ...validForm, governorate: 'jahra' }).governorate, undefined);
});

test('city or area is required and accepts both storefront scripts', () => {
  assert.equal(validateCheckout({ ...validForm, city: '' }).city, 'required');
  assert.equal(validateCheckout({ ...validForm, city: 'السالمية' }).city, undefined);
  assert.equal(validateCheckout({ ...validForm, city: 'Salmiya' }).city, undefined);
});

test('block, street and building take short alphanumerics in either script', () => {
  const part = (field, value) => validateCheckout({ ...validForm, [field]: value })[field];

  assert.equal(part('block', '3'), undefined);
  assert.equal(part('building', '12A'), undefined);
  assert.equal(part('street', 'شارع ٤٠'), undefined);
  assert.equal(part('block', ''), 'required');
  assert.equal(part('block', 'x'.repeat(25)), 'addressPart');
});

test('accepts Kuwaiti mobile numbers and rejects landlines and wrong lengths', () => {
  const phone = (p) => validateCheckout({ ...validForm, phone: p }).phone;

  assert.equal(phone('55551234'), undefined);      // 5-prefix mobile
  assert.equal(phone('66551234'), undefined);      // 6-prefix
  assert.equal(phone('99887766'), undefined);      // 9-prefix
  assert.equal(phone('+965 9988 7766'), undefined); // country code tolerated
  assert.equal(phone('22334455'), 'phone');        // landline: 2-prefix
  assert.equal(phone('5555123'), 'phone');         // too short
  assert.equal(phone('abc12345'), 'phone');        // letters
});

// The floor/flat line is the one optional field.
test('the optional details line is never required', () => {
  assert.equal(validateCheckout({ ...validForm, details: '' }).details, undefined);
  assert.equal(validateCheckout({ ...validForm, details: 'Floor 2, flat 5' }).details, undefined);
});
