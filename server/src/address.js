import { validateCheckout } from '../../src/pages/Checkout/checkoutValidation.js';

// A Kuwaiti delivery address, read and validated the same way wherever it
// arrives — the profile page saves one, and checkout sends one per order.
//
// Validated by the CHECKOUT's own function rather than a second copy of the
// rules, so the browser form, the saved address and the order snapshot cannot
// drift apart. That function is address-only now — the card fields it used to
// validate belonged to demo payment methods that no longer exist.

export const ADDRESS_FIELDS = [
  'fullName',
  'governorate',
  'city',
  'block',
  'street',
  'building',
  // Optional. validateCheckout ignores it, which is the point: a floor or flat
  // number is free text, not part of a Kuwaiti address's structure.
  'details',
  'phone'
];

// Coerced to strings first. The validator is shared with the browser form, where
// every value is already a string; over HTTP a field can arrive as a number, an
// object or an array, and `.trim()` on one of those is a 500 rather than a 400.
export function readAddress(input) {
  const address = {};
  for (const field of ADDRESS_FIELDS) {
    const value = input?.[field];
    address[field] = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  }
  return address;
}

export function addressErrors(address) {
  return validateCheckout(address);
}
