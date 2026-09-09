// Display currencies.
//
// The shop prices, charges and settles in Kuwaiti dinar. Everything here is a
// CONVENIENCE CONVERSION for a shopper reading from elsewhere in the Gulf or
// abroad — which is why the switcher says so and why the machine-readable
// JSON-LD offers stay in KWD regardless of what is on screen.
//
// Two things about this list that are easy to get wrong:
//
// 1. **Decimal places are not all two.** The dinar-family currencies subdivide
//    into 1000 rather than 100 — Kuwaiti dinar, Bahraini dinar and Omani rial
//    all carry THREE decimals. Formatting 26.900 KD as 26.90 BD would be wrong
//    money, not just wrong style. That is the same rule the storefront already
//    applies to KWD, generalised.
//
// 2. **The Gulf rates are pegged, the euro is not.** SAR, AED, QAR, BHD and OMR
//    are each pegged to the US dollar at a fixed rate, and the dinar is pegged
//    to an undisclosed basket that has held near 0.307 KWD/USD for years. So
//    those six numbers barely move, and a stale table stays close to correct.
//    EUR floats and will drift — it is the one row that ages.
//
// Rates are per 1 KWD, quoted as of the date below. There is no backend and no
// rates API, so they are static by design rather than by omission.

export const RATES_AS_OF = '2026-09-01';

// What Stripe will settle in, and why it matters here.
//
// A Stripe account can only charge in a currency it holds a bank account for.
// A default account supports a long list — and the three it does NOT support
// are exactly the three-decimal Gulf currencies: KWD, BHD and OMR. That is not
// a coincidence; those need a local bank account in-country.
//
// So the shop prices in dinar and CHARGES in something Stripe accepts. The
// dinar stays the source of truth on the order; the charge is a conversion made
// at the moment of payment and recorded alongside it.
//
// Confirmed against a live test account rather than assumed — the API refused
// `kwd` outright with the supported list in the error.
export const STRIPE_FALLBACK_CURRENCY = 'USD';

// The currency everything is stored, summed and charged in.
export const BASE_CURRENCY = 'KWD';

export const currencies = [
  {
    code: 'KWD',
    rate: 1,
    decimals: 3,
    stripeSupported: false,
    symbol: { ar: 'د.ك', en: 'KD' },
    name: { ar: 'دينار كويتي', en: 'Kuwaiti Dinar' }
  },
  {
    code: 'SAR',
    rate: 12.227,
    decimals: 2,
    stripeSupported: true,
    symbol: { ar: 'ر.س', en: 'SAR' },
    name: { ar: 'ريال سعودي', en: 'Saudi Riyal' }
  },
  {
    code: 'AED',
    rate: 11.974,
    decimals: 2,
    stripeSupported: true,
    symbol: { ar: 'د.إ', en: 'AED' },
    name: { ar: 'درهم إماراتي', en: 'UAE Dirham' }
  },
  {
    code: 'QAR',
    rate: 11.869,
    decimals: 2,
    stripeSupported: true,
    symbol: { ar: 'ر.ق', en: 'QAR' },
    name: { ar: 'ريال قطري', en: 'Qatari Riyal' }
  },
  {
    code: 'BHD',
    rate: 1.226,
    decimals: 3,
    stripeSupported: false,
    symbol: { ar: 'د.ب', en: 'BD' },
    name: { ar: 'دينار بحريني', en: 'Bahraini Dinar' }
  },
  {
    code: 'OMR',
    rate: 1.254,
    decimals: 3,
    stripeSupported: false,
    symbol: { ar: 'ر.ع.', en: 'OMR' },
    name: { ar: 'ريال عماني', en: 'Omani Rial' }
  },
  {
    code: 'EUR',
    rate: 3.019,
    decimals: 2,
    stripeSupported: true,
    symbol: { ar: '€', en: '€' },
    name: { ar: 'يورو', en: 'Euro' }
  },
  {
    code: 'USD',
    rate: 3.261,
    decimals: 2,
    stripeSupported: true,
    symbol: { ar: '$', en: '$' },
    name: { ar: 'دولار أمريكي', en: 'US Dollar' }
  }
];

const byCode = new Map(currencies.map((c) => [c.code, c]));

export function getCurrency(code) {
  return byCode.get(code) || byCode.get(BASE_CURRENCY);
}

export function isCurrency(code) {
  return byCode.has(code);
}

// Which currency Stripe will actually be asked to charge: the shopper's own if
// the account can settle it, otherwise the dollar. A Saudi shopper reading in
// riyals pays in riyals; a Kuwaiti one reading in dinar pays the dollar
// equivalent, because Stripe cannot take dinar.
export function chargeCurrencyFor(displayCode) {
  const chosen = byCode.get(displayCode);
  return chosen?.stripeSupported ? chosen : byCode.get(STRIPE_FALLBACK_CURRENCY);
}

// Convert an amount in the BASE currency (dinar) into a Stripe amount, in that
// currency's smallest unit. Every Stripe-supported currency here has two
// decimals, so this is × rate × 100 — no three-decimal multiple-of-ten rule to
// worry about, because the currencies that need it are the ones Stripe refuses.
export function toStripeAmount(baseAmount, code) {
  const currency = getCurrency(code);
  return Math.round(baseAmount * currency.rate * 10 ** currency.decimals);
}
