import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCompare, MAX_COMPARE } from '../../context/CompareContext.jsx';
import { getProductColors } from '../../data/products.js';
import DeviceRender from '../DeviceRender/DeviceRender.jsx';
import Button from '../Button/Button.jsx';
import styles from './CompareTray.module.css';

// A persistent tray showing what is queued for comparison.
//
// Without it, ticking "compare" on a card would be a silent action — nothing
// visibly happens, and the shopper has no idea the selection exists or how to
// act on it. The tray is the feedback and the call to action in one.
//
// Hidden on the comparison page itself, where it would be describing the page
// you are already looking at.
export default function CompareTray() {
  const { lang, t } = useLanguage();
  const { products, remove, clear, count } = useCompare();
  const location = useLocation();
  const navigate = useNavigate();

  const onComparePage = location.pathname === '/compare';
  const show = count > 0 && !onComparePage;

  return (
    <div
      className={`${styles.tray} ${show ? styles.trayShown : ''}`}
      aria-hidden={!show}
      inert={show ? undefined : ''}
    >
      <div className={`container ${styles.inner}`}>
        <div className={styles.slots}>
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.slot}
              onClick={() => remove(p.id)}
              aria-label={`${t.compare.remove}: ${p.name[lang]}`}
              title={p.name[lang]}
            >
              <DeviceRender color={getProductColors(p)[0]} brand={p.brand} size={18} />
              <span className={styles.slotX} aria-hidden="true">✕</span>
            </button>
          ))}
          {/* Empty slots make the ceiling legible without a sentence explaining it. */}
          {Array.from({ length: MAX_COMPARE - count }).map((_, i) => (
            <span key={`empty-${i}`} className={styles.slotEmpty} aria-hidden="true" />
          ))}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.clearBtn} onClick={clear}>
            {t.compare.clear}
          </button>
          <Button
            variant="primary"
            onClick={() => navigate('/compare')}
            // One phone cannot be compared with anything.
            disabled={count < 2}
          >
            {t.compare.cta} ({count})
          </Button>
        </div>
      </div>
    </div>
  );
}
