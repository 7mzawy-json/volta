import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useMoney } from '../../context/CurrencyContext.jsx';
import { getPriceRange, getProductColors } from '../../data/products.js';
import DeviceRender from '../DeviceRender/DeviceRender.jsx';
import Button from '../Button/Button.jsx';
import styles from './ScrollShowcase.module.css';

// A pinned product sequence: the phone holds the middle of the screen and turns
// as you scroll past, while three specs take it in turn.
//
// This REPLACES the first spotlight rather than adding a section, and that is
// deliberate. The homepage's rule is that no product appears twice (see
// homepageProducts.js); a new showcase section would have needed a product, and
// the only interesting ones were already on the page. So the lead spotlight
// became the thing that moves.
//
// Progress is measured, not observed. An IntersectionObserver only fires at
// thresholds and this needs a continuous 0-1; a scroll listener throttled to one
// read per frame is both simpler and, in this repo's automation pane, the only
// one that reliably reports at all.

// Bigger is better for all three, and each has a unit the catalogue stores
// separately from the number.
const BEATS = [
  { id: 'screen', unit: '"' },
  { id: 'camera', unit: 'MP' },
  { id: 'battery', unit: 'mAh' }
];

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export default function ScrollShowcase({ product }) {
  const { lang, t } = useLanguage();
  const money = useMoney();
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  // Read on the first render rather than in an effect. An effect runs AFTER the
  // first paint, so someone who asked for reduced motion would still get one
  // frame of the animated layout — and an accessibility scan that samples early
  // would measure that frame rather than the one they actually see.
  const [still, setStill] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setStill(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (still) return undefined;
    const section = sectionRef.current;
    if (!section) return undefined;

    let frame = 0;
    const read = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      // The travel is everything past the first screenful: while the section is
      // taller than the viewport, that difference is how far the pin can hold.
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) {
        setProgress(0);
        return;
      }
      setProgress(clamp(-rect.top / travel, 0, 1));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [still]);

  if (!product) return null;

  const beats = BEATS.map((beat) => ({
    ...beat,
    label: t.compare.rows[beat.id],
    value: product.attributes?.[beat.id]
  })).filter((beat) => beat.value != null);

  if (!beats.length) return null;

  // Which spec is speaking. The last beat holds to the end rather than the
  // sequence going blank while the section finishes scrolling past.
  const active = still ? -1 : clamp(Math.floor(progress * beats.length), 0, beats.length - 1);
  const { min } = getPriceRange(product);

  return (
    <section
      ref={sectionRef}
      className={`${styles.showcase} ${still ? styles.still : ''}`}
      style={still ? undefined : { '--p': progress }}
      aria-label={product.name[lang]}
    >
      <div className={styles.sticky}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.stage}>
            <div className={styles.glow} />
            <div className={styles.device}>
              <DeviceRender
                color={getProductColors(product)[0]}
                brand={product.brand}
                wide={product.attributes?.screen >= 7.5}
                size={260}
              />
            </div>
          </div>

          <div className={styles.copy}>
            <p className={styles.label}>{t.spotlight.label}</p>
            <h2 className={styles.title}>{product.name[lang]}</h2>

            {/* Every spec is in the DOM the whole time: a screen reader gets the
                complete list in order, and only the visual state changes. */}
            <ul className={styles.beats}>
              {beats.map((beat, i) => (
                <li
                  key={beat.id}
                  className={`${styles.beat} ${!still && i === active ? styles.beatActive : ''}`}
                >
                  <span className={styles.beatValue} dir="ltr">
                    {beat.value}
                    <span className={styles.beatUnit}>{beat.unit}</span>
                  </span>
                  <span className={styles.beatLabel}>{beat.label}</span>
                </li>
              ))}
            </ul>

            <p className={styles.price}>
              <span className={styles.from}>{t.product.from} </span>
              {money(min)}
            </p>

            <Button variant="primary" to={`/products/${product.id}`}>
              {t.spotlight.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
