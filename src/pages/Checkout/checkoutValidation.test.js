import test from 'node:test';
import assert from 'node:assert/strict';
import { copy } from '../../data/copy.js';
import { validateCheckout } from './checkoutValidation.js';

const NOW = new Date('2026-09-03T12:00:00Z');

// Kuwaiti address shape: governorate + block + street + building, not a western
// "street address, city" pair.
const validForm = {
  fullName: 'Noura Al-Sabah',
  governorate: 'capital',
  block: '3',
  street: '40',
  building: '12A',
  details: '',
  phone: '+965 5555-1234',
  cardNumber: '4242 4242 4242 4242',
  expiry: '10/26',
  cvc: '123'
};

const FIELDS = ['fullName', 'governorate', 'block', 'street', 'building', 'phone'];

test('a fully valid Kuwaiti address passes', () => {
  assert.deepEqual(validateCheckout(validForm, 'visa', NOW), {});
});

test('returns stable error codes that can be translated at render time', () => {
  const errors = validateCheckout({ ...validForm, fullName: '' }, 'visa', NOW);

  assert.equal(errors.fullName, 'required');
  assert.equal(copy.en.errors[errors.fullName], 'This field is required');
  assert.equal(copy.ar.errors[errors.fullName], 'هذي الخانة مطلوبة');
});

test('every error code has copy in both languages', () => {
  const emptyForm = Object.fromEntries(Object.keys(validForm).map((key) => [key, '']));
  const codes = new Set([
    ...Object.values(validateCheckout(emptyForm, 'visa', NOW)),
    ...Object.values(validateCheckout({ ...validForm, governorate: 'atlantis', phone: 'abc' }, 'visa', NOW))
  ]);

  for (const code of codes) {
    assert.ok(copy.en.errors[code], `missing English copy for "${code}"`);
    assert.ok(copy.ar.errors[code], `missing Arabic copy for "${code}"`);
  }
});

test('changing to Apple Pay preserves shipping errors and removes only card errors', () => {
  const emptyForm = Object.fromEntries(Object.keys(validForm).map((key) => [key, '']));

  assert.deepEqual(Object.keys(validateCheckout(emptyForm, 'visa', NOW)), [
    ...FIELDS,
    'cardNumber',
    'expiry',
    'cvc'
  ]);
  assert.deepEqual(Object.keys(validateCheckout(emptyForm, 'applepay', NOW)), FIELDS);
});

test('governorate must be one of the six, not merely non-empty', () => {
  assert.equal(validateCheckout({ ...validForm, governorate: 'atlantis' }, 'visa', NOW).governorate, 'governorate');
  assert.equal(validateCheckout({ ...validForm, governorate: 'jahra' }, 'visa', NOW).governorate, undefined);
});

test('accepts Kuwaiti mobile numbers and rejects landlines and wrong lengths', () => {
  const phone = (p) => validateCheckout({ ...validForm, phone: p }, 'visa', NOW).phone;

  assert.equal(phone('55551234'), undefined);      // 5-prefix mobile
  assert.equal(phone('66551234'), undefined);      // 6-prefix
  assert.equal(phone('99887766'), undefined);      // 9-prefix
  assert.equal(phone('+965 9988 7766'), undefined); // country code tolerated
  assert.equal(phone('22334455'), 'phone');        // landline: 2-prefix
  assert.equal(phone('5555123'), 'phone');         // too short
  assert.equal(phone('abc12345'), 'phone');        // letters
});

test('rejects alphabetic card values even when digit counts are sufficient', () => {
  const errors = validateCheckout({ ...validForm, cardNumber: 'abc1234567890123456' }, 'visa', NOW);
  assert.equal(errors.cardNumber, 'cardNumber');
});

test('rejects impossible or expired expiry dates', () => {
  const expiry = (e) => validateCheckout({ ...validForm, expiry: e }, 'visa', NOW).expiry;

  assert.equal(expiry('99/99'), 'expiry');  // month 99 does not exist
  assert.equal(expiry('00/30'), 'expiry');  // month 00 does not exist
  assert.equal(expiry('08/26'), 'expiry');  // one month before NOW
  assert.equal(expiry('09/26'), undefined); // the current month is still valid
  assert.equal(expiry('01/30'), undefined);
});
