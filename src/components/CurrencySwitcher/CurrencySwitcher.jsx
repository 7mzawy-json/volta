import { useId } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import { currencies, RATES_AS_OF } from '../../data/currencies.js';
import styles from './CurrencySwitcher.module.css';

// A native <select> on purpose.
//
// It is keyboard-operable, screen-reader-labelled and touch-friendly for free,
// a phone renders it as the OS picker, and it matches the governorate control at
// checkout. A custom listbox would be eight currencies of extra ARIA for no gain
// — and the header is the one place in this storefront where added width has
// already caused a P0 (the 375 px overflow), so the smallest control wins.

export default function CurrencySwitcher({ compact = false }) {
  const { lang, t } = useLanguage();
  const { code, setCurrency } = useCurrency();
  const id = useId();

  // Split rather than interpolate, so the date can be isolated as its own LTR
  // run. A hyphen-joined date inside an Arabic sentence is reordered by the bidi
  // algorithm and comes out backwards.
  const [before, after] = t.currency.asOf.split('{date}');

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : styles.full}`}>
      <label className={compact ? 'visually-hidden' : styles.label} htmlFor={id}>
        {t.nav.currency}
      </label>

      <select
        id={id}
        className={styles.select}
        value={code}
        onChange={(e) => setCurrency(e.target.value)}
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {/* No flag emoji: Windows has no country-flag font, so 🇰🇼 renders as
                the bare letters "kw". Compact keeps the header narrow; the
                drawer has room for the name, which is what most people
                actually recognise. */}
            {compact ? `${c.symbol[lang]} ${c.code}` : `${c.code} — ${c.name[lang]}`}
          </option>
        ))}
      </select>

      {!compact && (
        <p className={styles.note}>
          {t.currency.note}{' '}
          {before}
          <bdi dir="ltr">{RATES_AS_OF}</bdi>
          {after}
        </p>
      )}
    </div>
  );
}
