import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCompare } from '../../context/CompareContext.jsx';
import { getPriceRange, getProductColors, getStorageOptions, brandLabels } from '../../data/products.js';
import { getColor } from '../../data/colors.js';
import DeviceRender from '../../components/DeviceRender/DeviceRender.jsx';
import Button from '../../components/Button/Button.jsx';
import { formatPrice } from '../../utils/currency.js';
import styles from './Compare.module.css';

// The comparison table.
//
// Its whole job is answering "how do these differ", so rows where every phone
// agrees are dimmed rather than hidden: hiding them would leave the reader
// unsure whether a spec was equal or simply missing, while dimming says "checked,
// no difference here" and lets the eye fall on the rows that matter. The
// differences-only switch is the opt-in version of that for anyone who has
// already accepted the dimmed rows and wants them gone.
//
// The best value in each numeric row is marked, because "5000 vs 4441 mAh" only
// helps if you know which way is better — and that differs per row.
//
// On a narrow screen the table scrolls sideways, and a scrollbar alone is not a
// signal that a fourth phone exists: hence snapping, a position counter and
// explicit previous/next buttons. All three appear only when the table actually
// overflows, so two phones on a desktop get a clean table with no chrome that
// does nothing.

// higher: is a bigger number better for this attribute?
const ROWS = [
  { id: 'price', higher: false },
  { id: 'brand' },
  { id: 'screen', higher: true, unit: '"' },
  { id: 'camera', higher: true, unit: 'MP' },
  { id: 'battery', higher: true, unit: 'mAh' },
  { id: 'refreshRate', higher: true, unit: 'Hz' },
  { id: 'storage' },
  { id: 'color' }
];

export default function Compare() {
  const { lang, t } = useLanguage();
  const { products, remove, clear } = useCompare();

  const scrollerRef = useRef(null);
  const headRefs = useRef([]);
  const [active, setActive] = useState(0);
  const [overflows, setOverflows] = useState(false);
  const [diffOnly, setDiffOnly] = useState(false);

  // Which column is the reader looking at, and is there anything to scroll to?
  //
  // Deliberately not scrollLeft: its sign and origin differ between engines in
  // RTL, which is exactly the direction this storefront defaults to. Comparing
  // each column's centre against the viewport's centre is the same arithmetic
  // in both directions, so there is no RTL branch to get wrong.
  const measure = useCallback(() => {
    const sc = scrollerRef.current;
    if (!sc) return;

    setOverflows(sc.scrollWidth - sc.clientWidth > 4);

    const box = sc.getBoundingClientRect();
    const centre = box.left + box.width / 2;
    let nearest = 0;
    let shortest = Infinity;
    headRefs.current.slice(0, products.length).forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const distance = Math.abs(r.left + r.width / 2 - centre);
      if (distance < shortest) {
        shortest = distance;
        nearest = i;
      }
    });
    setActive(nearest);
  }, [products.length]);

  useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return undefined;

    // One measurement per frame at most; a scroll event fires far more often
    // than the counter can usefully change.
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    sc.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    measure();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      sc.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [measure, diffOnly]);

  const goTo = (index) => {
    const el = headRefs.current[index];
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // inline: 'start' is direction-aware, so this needs no RTL branch either.
    // block: 'nearest' keeps the page from jumping vertically on the way.
    el.scrollIntoView({ behavior: still ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
  };

  if (products.length === 0) {
    return (
      <main className={`container ${styles.empty}`}>
        <h1>{t.compare.title}</h1>
        <p>{t.compare.empty}</p>
        <Button variant="primary" to="/products?category=phones">
          {t.compare.browse}
        </Button>
      </main>
    );
  }

  // Raw comparable value per product for one row, plus its display string.
  const valueFor = (product, row) => {
    switch (row.id) {
      case 'price':
        return { raw: getPriceRange(product).min, text: formatPrice(getPriceRange(product).min, lang) };
      case 'brand':
        return { raw: product.brand, text: brandLabels[product.brand] || product.brand };
      case 'storage': {
        const sizes = getStorageOptions(product);
        return { raw: sizes.join(','), text: sizes.join(' · ') || '—' };
      }
      case 'color': {
        const colors = getProductColors(product);
        return { raw: colors.join(','), text: colors.map((c) => getColor(c).name[lang]).join(' · ') || '—', colors };
      }
      default: {
        const v = product.attributes?.[row.id];
        return { raw: v ?? null, text: v == null ? '—' : `${v}${row.unit || ''}` };
      }
    }
  };

  // Resolved once per render so the differences-only switch can filter on it.
  const rows = ROWS.map((row) => {
    const cells = products.map((p) => valueFor(p, row));
    const allSame = cells.every((c) => String(c.raw) === String(cells[0].raw));

    // Only mark a winner when the row is numeric, has a direction, and the
    // values actually differ.
    const numbers = cells.map((c) => (typeof c.raw === 'number' ? c.raw : null));
    const comparable = row.higher !== undefined && numbers.every((n) => n !== null) && !allSame;
    const best = comparable ? (row.higher ? Math.max(...numbers) : Math.min(...numbers)) : null;

    return { row, cells, allSame, comparable, best };
  });

  // A single phone makes every row trivially identical, so the switch would
  // empty the table and tell the reader nothing. Offer it from two up.
  const canFilter = products.length > 1;
  const visibleRows = canFilter && diffOnly ? rows.filter((r) => !r.allSame) : rows;

  // Arrows are not mirrored by the bidi algorithm, so they are chosen per
  // language: "previous" points at the start of the line, which is the
  // right-hand side in Arabic and the left in English.
  //
  // Arrows specifically, not guillemets. U+2039/203A ARE in the bidi mirroring
  // set, so the engine would flip them and this code would flip them again,
  // landing back where it started. U+2190/2192 are not mirrored, so what is
  // written here is what renders.
  const prevGlyph = lang === 'ar' ? '→' : '←';
  const nextGlyph = lang === 'ar' ? '←' : '→';
  const position = t.compare.positionOf
    .replace('{n}', String(active + 1))
    .replace('{total}', String(products.length));

  return (
    <main className={`container ${styles.page}`}>
      <div className={styles.head}>
        <h1 className={styles.title}>{t.compare.title}</h1>
        <button type="button" className={styles.clearBtn} onClick={clear}>
          {t.compare.clear}
        </button>
      </div>

      {canFilter && (
        <div className={styles.tools}>
          <label className={styles.toggle}>
            <span className={styles.toggleName}>{t.compare.differencesOnly}</span>
            <input
              type="checkbox"
              className={styles.switchInput}
              checked={diffOnly}
              onChange={() => setDiffOnly((v) => !v)}
            />
            <span className={styles.switch} aria-hidden="true">
              <span className={styles.switchKnob} />
            </span>
          </label>

          {/* Orientation for a table wider than the screen. Hidden entirely when
              every column already fits, rather than sitting there disabled. */}
          {overflows && (
            <div className={styles.pager}>
              <button
                type="button"
                className={styles.pagerBtn}
                onClick={() => goTo(active - 1)}
                disabled={active === 0}
                aria-label={t.compare.prev}
              >
                <span aria-hidden="true">{prevGlyph}</span>
              </button>
              {/* Visual only: this changes on every scroll frame, and a live
                  region announcing it would talk over the table itself. The
                  buttons carry the accessible names instead. */}
              <span className={styles.position} aria-hidden="true" dir="ltr">
                {active + 1} / {products.length}
              </span>
              <button
                type="button"
                className={styles.pagerBtn}
                onClick={() => goTo(active + 1)}
                disabled={active >= products.length - 1}
                aria-label={t.compare.next}
              >
                <span aria-hidden="true">{nextGlyph}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scrolls horizontally on narrow screens rather than crushing columns —
          an unreadable four-column table is worse than a scrollable one. It is
          focusable because a region you can only reach by scrolling has to be
          reachable from the keyboard too (WCAG 2.1.1). */}
      <div
        ref={scrollerRef}
        className={styles.scroller}
        tabIndex={0}
        role="group"
        aria-label={`${t.compare.title} — ${position}`}
      >
        <table className={styles.table}>
          <caption className="visually-hidden">{t.compare.title}</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.rowHead}>
                <span className="visually-hidden">{t.compare.attribute}</span>
              </th>
              {products.map((p, i) => (
                <th
                  scope="col"
                  key={p.id}
                  className={styles.productHead}
                  ref={(el) => {
                    headRefs.current[i] = el;
                  }}
                >
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => remove(p.id)}
                    aria-label={`${t.compare.remove}: ${p.name[lang]}`}
                  >
                    ✕
                  </button>
                  <Link to={`/products/${p.id}`} className={styles.headLink}>
                    <DeviceRender
                      color={getProductColors(p)[0]}
                      brand={p.brand}
                      wide={p.attributes?.screen >= 7.5}
                      size={54}
                    />
                    <span className={styles.headName}>{p.name[lang]}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.map(({ row, cells, allSame, comparable, best }) => (
              <tr key={row.id} className={allSame ? styles.rowSame : ''}>
                <th scope="row" className={styles.rowHead}>
                  {t.compare.rows[row.id]}
                </th>
                {cells.map((cell, i) => (
                  <td
                    key={products[i].id}
                    className={`${styles.cell} ${comparable && cell.raw === best ? styles.cellBest : ''}`}
                  >
                    {row.id === 'color' && cell.colors ? (
                      <span className={styles.swatches}>
                        {cell.colors.map((c) => (
                          <span
                            key={c}
                            className={styles.swatch}
                            style={{ background: getColor(c).hex }}
                            title={getColor(c).name[lang]}
                          />
                        ))}
                      </span>
                    ) : (
                      cell.text
                    )}
                    {comparable && cell.raw === best && (
                      <span className="visually-hidden"> — {t.compare.best}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* The legend has to describe what is actually on screen. Once the switch
          removes the identical rows there are no dimmed rows left to explain,
          and two phones can genuinely match on every row we show — saying so is
          more useful than an empty table with a caption about dimming. */}
      <p className={styles.legend}>
        {visibleRows.length === 0
          ? t.compare.noDifferences
          : diffOnly
            ? t.compare.legendDiff
            : t.compare.legend}
      </p>
    </main>
  );
}
