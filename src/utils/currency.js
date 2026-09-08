// Money.
//
// The dinar subdivides into 1000 fils, so Kuwaiti retail prices carry THREE
// decimal places (26.900 KD, never 26.90). Local convention — including Xcite's
// own storefront — uses Western digits in both languages and the short "KD" /
// "د.ك" label rather than the ISO code, so the number is formatted with Intl and
// the label appended, rather than using style: 'currency'.
//
// A shopper can switch the DISPLAY currency (see data/currencies.js). Two rules
// hold whatever they pick:
//
//   * Arithmetic stays in dinar. Subtotals are summed in KWD and converted once
//     at the point of display, so a converted line total and a converted
//     subtotal can never disagree by a rounding step.
//   * Structured data stays in dinar. formatPriceValue() feeds the JSON-LD
//     offers, which declare priceCurrency KWD because that is what the shop
//     actually charges. It deliberately takes no currency argument.

import { BASE_CURRENCY, getCurrency } from '../data/currencies.js';

// One formatter per decimal precision, built once. Intl formatters are
// expensive to construct and these are hit on every price on the page.
const formatters = new Map();

function formatterFor(decimals) {
  if (!formatters.has(decimals)) {
    formatters.set(
      decimals,
      new Intl.NumberFormat('en-KW', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    );
  }
  return formatters.get(decimals);
}

export function convert(amount, code = BASE_CURRENCY) {
  return amount * getCurrency(code).rate;
}

export function formatPrice(amount, lang = 'ar', code = BASE_CURRENCY) {
  const currency = getCurrency(code);
  const label = currency.symbol[lang] || currency.symbol.en;
  const value = formatterFor(currency.decimals).format(convert(amount, currency.code));
  return `${value} ${label}`;
}

// Machine-readable offers need the dinar's three decimal places and no visible
// label. Kept on the same formatter as shopper-facing prices so structured data
// cannot drift to two decimals — and deliberately NOT currency-aware, because
// the offer's priceCurrency is KWD no matter what the shopper is reading in.
export function formatPriceValue(amount) {
  return formatterFor(getCurrency(BASE_CURRENCY).decimals).format(amount);
}
