// Kuwaiti dinar pricing.
//
// The dinar subdivides into 1000 fils, so retail prices carry THREE decimal
// places (26.900 KD, never 26.90). Local convention — including Xcite's own
// storefront — uses Western digits in both languages and the short "KD" / "د.ك"
// label rather than the ISO "KWD" code, so we format the number with Intl and
// append the label ourselves rather than using style: 'currency'.

const CURRENCY_LABEL = { ar: 'د.ك', en: 'KD' };

const dinarFormat = new Intl.NumberFormat('en-KW', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3
});

export function formatPrice(amount, lang = 'ar') {
  const label = CURRENCY_LABEL[lang] || CURRENCY_LABEL.en;
  return `${formatPriceValue(amount)} ${label}`;
}

// Machine-readable offers still need the dinar's three decimal places, but not
// the visible KD / د.ك suffix. Keep that representation on the same formatter
// as shopper-facing prices so structured data cannot drift to two decimals.
export function formatPriceValue(amount) {
  return dinarFormat.format(amount);
}
