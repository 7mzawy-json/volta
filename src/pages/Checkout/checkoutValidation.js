const digits = (value) => value.replace(/\D/g, '');

const hasValue = (value) => Boolean(value?.trim());

const isPhoneValid = (value) => (
  /^\+?[\d\s()-]+$/.test(value.trim()) && digits(value).length >= 8
);

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

export function validateCheckout(values, payment, now = new Date()) {
  const errors = {};

  for (const field of ['fullName', 'address', 'city']) {
    if (!hasValue(values[field])) errors[field] = 'required';
  }

  if (!hasValue(values.phone)) errors.phone = 'required';
  else if (!isPhoneValid(values.phone)) errors.phone = 'phone';

  if (payment !== 'applepay') {
    if (!hasValue(values.cardNumber)) errors.cardNumber = 'required';
    else if (!isCardNumberValid(values.cardNumber)) errors.cardNumber = 'cardNumber';

    if (!hasValue(values.expiry)) errors.expiry = 'required';
    else if (!isExpiryValid(values.expiry, now)) errors.expiry = 'expiry';

    if (!hasValue(values.cvc)) errors.cvc = 'required';
    else if (!/^\d{3}$/.test(values.cvc.trim())) errors.cvc = 'cvc';
  }

  return errors;
}
