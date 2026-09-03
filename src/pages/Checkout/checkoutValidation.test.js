import test from 'node:test';
import assert from 'node:assert/strict';
import { copy } from '../../data/copy.js';
import { validateCheckout } from './checkoutValidation.js';

const NOW = new Date('2026-09-03T12:00:00Z');

const validForm = {
  fullName: 'Noura Al-Sabah',
  address: '12 Gulf Road',
  city: 'Kuwait City',
  phone: '+965 5555-1234',
  cardNumber: '4242 4242 4242 4242',
  expiry: '10/26',
  cvc: '123'
};

test('returns stable error codes that can be translated at render time', () => {
  const errors = validateCheckout({ ...validForm, fullName: '' }, 'visa', NOW);

  assert.equal(errors.fullName, 'required');
  assert.equal(copy.en.errors[errors.fullName], 'This field is required');
  assert.equal(copy.ar.errors[errors.fullName], 'هذي الخانة مطلوبة');
});

test('changing to Apple Pay preserves shipping errors and removes only card errors', () => {
  const emptyForm = Object.fromEntries(Object.keys(validForm).map((key) => [key, '']));

  assert.deepEqual(Object.keys(validateCheckout(emptyForm, 'visa', NOW)), [
    'fullName',
    'address',
    'city',
    'phone',
    'cardNumber',
    'expiry',
    'cvc'
  ]);
  assert.deepEqual(Object.keys(validateCheckout(emptyForm, 'applepay', NOW)), [
    'fullName',
    'address',
    'city',
    'phone'
  ]);
});

test('rejects alphabetic phone and card values even when digit counts are sufficient', () => {
  const errors = validateCheckout({
    ...validForm,
    phone: 'abc12345678',
    cardNumber: 'abc1234567890123456'
  }, 'visa', NOW);

  assert.equal(errors.phone, 'phone');
  assert.equal(errors.cardNumber, 'cardNumber');
});

test('rejects impossible or expired expiry dates', () => {
  assert.equal(
    validateCheckout({ ...validForm, expiry: '99/99' }, 'visa', NOW).expiry,
    'expiry'
  );
  assert.equal(
    validateCheckout({ ...validForm, expiry: '08/26' }, 'visa', NOW).expiry,
    'expiry'
  );
});

test('accepts supported formatting and a current or future expiry', () => {
  assert.deepEqual(validateCheckout(validForm, 'mastercard', NOW), {});
  assert.deepEqual(validateCheckout({ ...validForm, expiry: '09/26' }, 'visa', NOW), {});
});
