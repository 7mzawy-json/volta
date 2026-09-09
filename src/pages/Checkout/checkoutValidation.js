import { governorateIds, isKuwaitiMobile } from '../../data/kuwait.js';

// Pure checkout validation.
//
// Returns stable error CODES, never translated strings: storing translated text
// froze messages in whichever language was active when the error was raised, so
// a language toggle left them stale. The caller translates at render.
//
// Character classes are checked BEFORE digits are counted. Stripping non-digits
// and then counting confuses sanitisation with validation, and let values like
// "abc12345678" pass as an 8-digit phone number.

const digits = (value) => value.replace(/\D/g, '');

const hasValue = (value) => Boolean(value?.trim());

const isCardNumberValid = (value) => (
  /^[\d\s-]+$/.test(value.trim()) && digits(value).length === 16
);

const isExpiryValid = (value, now) => {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return year > currentYear || (year === currentYear && month >= currentMonth);
};

// Block, street and building are short alphanumerics — "3", "12A", "Street 40".
// Deliberately permissive on shape but not on emptiness or length.
const isAddressPart = (value) => /^[\w؀-ۿ\s/.-]{1,24}$/.test(value.trim());

const CARDLESS_METHODS = new Set(['applepay', 'stripe']);

export function validateCheckout(values, payment, now = new Date()) {
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

  // Methods that never touch the demo card fields. Stripe collects the card on
  // its own hosted page, so asking for one here would be theatre — and worse,
  // it would invite someone to type a real card number into a form that is not
  // PCI anything.
  if (!CARDLESS_METHODS.has(payment)) {
    if (!hasValue(values.cardNumber)) errors.cardNumber = 'required';
    else if (!isCardNumberValid(values.cardNumber)) errors.cardNumber = 'cardNumber';

    if (!hasValue(values.expiry)) errors.expiry = 'required';
    else if (!isExpiryValid(values.expiry, now)) errors.expiry = 'expiry';

    if (!hasValue(values.cvc)) errors.cvc = 'required';
    else if (!/^\d{3}$/.test(values.cvc.trim())) errors.cvc = 'cvc';
  }

  return errors;
}
