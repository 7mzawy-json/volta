import { useEffect, useState } from 'react';
import { formatPrice } from '../../utils/currency.js';
import styles from './PriceRange.module.css';

// Dual-handle price filter.
//
// Built from two stacked native range inputs rather than a drag library: they
// are keyboard accessible for free, cost nothing in bundle size, and the pointer
// events already work on touch. The handles cannot cross — each clamps against
// the other — so the range is always valid.
//
// The committed value only changes on release (onChange of a range input fires
// continuously while dragging); the label follows the drag live so the shopper
// still sees the number move under their finger.

export default function PriceRange({ bounds, value, onChange, lang }) {
  const [min, max] = bounds;
  const [draft, setDraft] = useState(value);

  // Follow external changes — clearing filters, or switching category.
  useEffect(() => {
    setDraft(value);
  }, [value[0], value[1]]);

  const [lo, hi] = draft;
  const span = max - min || 1;
  const loPct = ((lo - min) / span) * 100;
  const hiPct = ((hi - min) / span) * 100;

  const commit = (next) => {
    setDraft(next);
    onChange(next);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.readout}>
        <span>{formatPrice(lo, lang)}</span>
        <span>{formatPrice(hi, lang)}</span>
      </div>

      <div className={styles.track}>
        <span className={styles.rail} />
        {/* Inline width/offset: these are data-driven positions, not theme values. */}
        <span
          className={styles.fill}
          style={{ insetInlineStart: `${loPct}%`, width: `${Math.max(hiPct - loPct, 0)}%` }}
        />

        <input
          type="range"
          className={styles.input}
          min={min}
          max={max}
          value={lo}
          aria-label="minimum price"
          onChange={(e) => setDraft([Math.min(Number(e.target.value), hi), hi])}
          onMouseUp={() => commit(draft)}
          onTouchEnd={() => commit(draft)}
          onKeyUp={() => commit(draft)}
        />
        <input
          type="range"
          className={styles.input}
          min={min}
          max={max}
          value={hi}
          aria-label="maximum price"
          onChange={(e) => setDraft([lo, Math.max(Number(e.target.value), lo)])}
          onMouseUp={() => commit(draft)}
          onTouchEnd={() => commit(draft)}
          onKeyUp={() => commit(draft)}
        />
      </div>
    </div>
  );
}
