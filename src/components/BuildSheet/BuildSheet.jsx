import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useMoney } from '../../context/CurrencyContext.jsx';
import { plural } from '../../utils/plural.js';
import {
  CURRENCIES,
  DEMO_COUNT,
  DEMO_HREF,
  DEMO_INTENT,
  DEMO_PRICE_CEILING,
  LISTINGS,
  PRERENDERED_ROUTES,
  TESTS,
  VARIANTS
} from '../../data/siteFacts.js';
import styles from './BuildSheet.module.css';

// The homepage's closing argument, and the one section that talks about the site
// rather than the stock.
//
// It replaced four sales claims. Two of those survive here in a form the page
// can prove; the fourth promised a year of warranty on every device, which a
// shop that does not exist cannot promise. A fictional storefront can still be
// honest about how it was made, so that is what this says instead — with the
// numbers counted rather than written down. See src/data/siteFacts.js for where
// each one comes from.

const REDUCED = '(prefers-reduced-motion: reduce)';

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED).matches;
}

// Same contract as Reveal: anyone who asked their system for less motion gets
// the finished state on the first render, with no observer and no animation.
function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(prefersReduced);

  useEffect(() => {
    if (inView) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  return [ref, inView];
}

const TYPE_MS = 26;
const CHIP_MS = 110;
const COUNT_MS = 900;
const easeOut = (t) => 1 - (1 - t) ** 3;

// How much code the browser actually pulled down for this page.
//
// encodedBodySize rather than transferSize: the second is 0 on a repeat visit
// served from cache, and "0 KB" would be a lie of a different kind. Cross-origin
// entries without Timing-Allow-Origin report 0 and drop out of the sum — here
// that is the web font, which is why the label says "in code" rather than
// claiming to be the weight of everything on screen.
function measureBytes() {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return null;
  }
  const entries = [
    ...performance.getEntriesByType('navigation'),
    ...performance.getEntriesByType('resource')
  ];
  const total = entries.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0);
  return total > 0 ? total : null;
}

export default function BuildSheet() {
  const { lang, t } = useLanguage();
  const money = useMoney();
  const copy = t.build;

  const [panelRef, panelInView] = useInView();
  const [statsRef, statsInView] = useInView();
  const still = prefersReduced();

  // The sentence is a QUOTATION of what somebody typed, so it says the number
  // the way a person says it — "300 dinars", not "300.000 KD". The chip under it
  // is the storefront's own filter and goes through the money formatter, so it
  // follows whatever currency the shopper has chosen. They are two different
  // things and it is right that they read differently.
  const sentence = copy.demo.sentence.replace('{n}', DEMO_PRICE_CEILING);
  const ceiling = money(DEMO_PRICE_CEILING);

  // --- the sentence types itself ---------------------------------------------
  const [typedCount, setTypedCount] = useState(() => (prefersReduced() ? Infinity : 0));
  useEffect(() => {
    if (!panelInView || still) return undefined;
    setTypedCount(0);
    const timer = setInterval(() => {
      setTypedCount((n) => {
        if (n >= sentence.length) {
          clearInterval(timer);
          return n;
        }
        return n + 1;
      });
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [panelInView, still, sentence]);

  const typed = sentence.slice(0, typedCount);
  const typingDone = typedCount >= sentence.length;

  // --- the filters it came back as -------------------------------------------
  //
  // Read off the validated intent rather than written out, so a chip cannot
  // describe a filter the link below does not carry.
  const chips = [];
  if (DEMO_INTENT.category) chips.push(t.categories[DEMO_INTENT.category]);
  for (const bucket of DEMO_INTENT.screen) chips.push(t.facets.screens[bucket]);
  if (DEMO_INTENT.price) chips.push(copy.demo.under.replace('{price}', ceiling));
  if (DEMO_INTENT.sort === 'price-low') chips.push(copy.demo.cheapest);

  // --- the numbers count up ---------------------------------------------------
  const [bytes, setBytes] = useState(null);
  const [countProgress, setCountProgress] = useState(() => (prefersReduced() ? 1 : 0));

  useEffect(() => {
    if (!statsInView) return undefined;
    setBytes(measureBytes());
    if (still) return undefined;

    let frame = 0;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / COUNT_MS);
      setCountProgress(easeOut(p));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [statsInView, still]);

  const stats = [
    { id: 'variants', value: VARIANTS, note: copy.stats.variants.note.replace('{n}', LISTINGS) },
    { id: 'routes', value: PRERENDERED_ROUTES.length, note: copy.stats.routes.note },
    { id: 'currencies', value: CURRENCIES, note: copy.stats.currencies.note }
  ];
  // Claimed only once it has actually been measured.
  if (bytes) {
    stats.push({
      id: 'weight',
      value: Math.round(bytes / 1024),
      unit: copy.stats.weight.unit,
      note: copy.stats.weight.note
    });
  }

  const stack = [
    'React',
    'Vite',
    'Node',
    'Express',
    'MongoDB',
    'Stripe',
    'Gemini',
    'WCAG 2.1 AA',
    copy.stack.tests.replace('{n}', TESTS)
  ];

  return (
    <section className={`container ${styles.section}`} aria-labelledby="build-sheet-title">
      <h2 id="build-sheet-title" className={styles.title}>
        {copy.title}
      </h2>
      <p className={styles.lede}>{copy.lede}</p>

      <div ref={panelRef} className={`${styles.panel} ${typingDone ? styles.panelDone : ''}`}>
        <p className={styles.demoLabel}>{copy.demo.label}</p>

        {/* The whole sentence is in the DOM from the first render; only a
            duplicate of it is animated. A screen reader arriving mid-type gets
            the question, not half of it. */}
        <p className={styles.sentence}>
          <span className="visually-hidden">{sentence}</span>
          <span aria-hidden="true">
            {typed}
            {!typingDone && <span className={styles.caret} />}
            {/* The part not yet typed, occupying its space but not visible. It
                is what keeps the chips from walking up the page as the sentence
                grows, and it is exact at every width and in both languages —
                which a reserved min-height on the paragraph was not. */}
            <span className={styles.tail}>{sentence.slice(typedCount)}</span>
          </span>
        </p>

        <ul className={styles.chips}>
          {chips.map((chip, i) => (
            <li
              key={chip}
              className={styles.chip}
              style={still ? undefined : { transitionDelay: `${i * CHIP_MS}ms` }}
            >
              {chip}
            </li>
          ))}
        </ul>

        <p
          className={styles.outcome}
          style={still ? undefined : { transitionDelay: `${chips.length * CHIP_MS + 120}ms` }}
        >
          <span className={styles.count}>
            {plural(copy.demo.results, DEMO_COUNT, lang).replace('{n}', DEMO_COUNT)}
          </span>
          <Link to={DEMO_HREF} className={styles.cta}>
            {copy.demo.cta}
          </Link>
        </p>

        <p className={styles.caption}>{copy.demo.caption}</p>
      </div>

      <ul ref={statsRef} className={styles.stats}>
        {stats.map((stat) => (
          <li key={stat.id} className={styles.stat}>
            <span className={styles.statValue} dir="ltr">
              {Math.round(stat.value * countProgress)}
              {stat.unit && <span className={styles.statUnit}>{stat.unit}</span>}
            </span>
            <span className={styles.statLabel}>{copy.stats[stat.id].label}</span>
            <span className={styles.statNote}>{stat.note}</span>
          </li>
        ))}
      </ul>

      <p className={styles.stack}>
        <span className={styles.stackLabel}>{copy.stack.label}</span>
        {stack.map((item) => (
          <span key={item} className={styles.stackItem}>
            {item}
          </span>
        ))}
      </p>
    </section>
  );
}
