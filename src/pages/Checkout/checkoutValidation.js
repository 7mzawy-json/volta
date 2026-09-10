import { governorateIds, isKuwaitiMobile } from '../../data/kuwait.js';

// Delivery-address validation.
//
// Returns stable error CODES, never translated strings: storing translated text
// froze messages in whichever language was active when the error was raised, so
// a language toggle left them stale. The caller translates at render.
//
// Character classes are checked BEFORE digits are counted. Stripping non-digits
// and then counting confuses sanitisation with validation, and let values like
// "abc12345678" pass as an 8-digit phone number.
//
// This used to also validate a card number, expiry and CVC, behind a `payment`
// argument that switched them off for the methods that collect a card
// elsewhere. Those methods were demo buttons from before there was a payment
// provider: they took a made-up card, showed a confirmation page with a random
// number, and recorded nothing — so an order made that way could never appear in
// My Orders, which is exactly how it was reported. Stripe collects the card on
// its own hosted page, so nothing here should ever ask for one. The card rules
// are gone rather than disabled.
//
// One consequence worth stating: this is now purely an ADDRESS validator, which
// is why the server and the profile page can share it as-is.

const hasValue = (value) => Boolean(value?.trim());

// Block, street and building are short alphanumerics — "3", "12A", "Street 40".
// Deliberately permissive on shape but not on emptiness or length.
const isAddressPart = (value) => /^[\w؀-ۿ\s/.-]{1,24}$/.test(value.trim());

export function validateCheckout(values) {
  const errors = {};

  if (!hasValue(values.fullName)) errors.fullName = 'required';

  // Governorate is a closed set, so an unknown value is invalid rather than
  // merely empty — that distinction matters if the select is ever tampered with.
  if (!hasValue(values.governorate)) errors.governorate = 'required';
  else if (!governorateIds.includes(values.governorate)) errors.governorate = 'governorate';

  // City / area is intentionally free text. Governorates are a closed set, but
  // their localities are numerous and an incomplete dropdown would reject real
  // delivery addresses.
  if (!hasValue(values.city)) errors.city = 'required';

  for (const field of ['block', 'street', 'building']) {
    if (!hasValue(values[field])) errors[field] = 'required';
    else if (!isAddressPart(values[field])) errors[field] = 'addressPart';
  }

  if (!hasValue(values.phone)) errors.phone = 'required';
  else if (!isKuwaitiMobile(values.phone)) errors.phone = 'phone';

  return errors;
}
