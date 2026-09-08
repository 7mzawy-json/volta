import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLanguage } from './LanguageContext.jsx';
import { BASE_CURRENCY, getCurrency, isCurrency } from '../data/currencies.js';
import { formatPrice } from '../utils/currency.js';

const CurrencyContext = createContext(null);

const STORAGE_KEY = 'volta-currency';

// The Kuwaiti dinar on first visit, always. This is a Kuwaiti shop that charges
// in dinar; another currency is a reading convenience the shopper opts into, so
// guessing one from a locale or a timezone would put a stranger's currency in
// front of a local customer.
function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isCurrency(stored) ? stored : BASE_CURRENCY;
  } catch {
    return BASE_CURRENCY;
  }
}

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* private mode — the choice still applies for this session */
    }
  }, [code]);

  const value = useMemo(
    () => ({
      code,
      currency: getCurrency(code),
      setCurrency: (next) => setCode(isCurrency(next) ? next : BASE_CURRENCY),
      isBase: code === BASE_CURRENCY
    }),
    [code]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}

// One formatter bound to the current language AND currency, so a price render
// site does not have to know about either. Every amount passed in is in dinar —
// that is the invariant the whole thing rests on.
export function useMoney() {
  const { lang } = useLanguage();
  const { code } = useCurrency();
  return useMemo(() => (amount) => formatPrice(amount, lang, code), [lang, code]);
}
