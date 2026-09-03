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
// no difference here" and lets the eye fall on the rows that matter.
//
// The best value in each numeric row is marked, because "5000 vs 4441 mAh" only
// helps if you know which way is better — and that differs per row.

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

  return (
    <main className={`container ${styles.page}`}>
      <div className={styles.head}>
        <h1 className={styles.title}>{t.compare.title}</h1>
        <button type="button" className={styles.clearBtn} onClick={clear}>
          {t.compare.clear}
        </button>
      </div>

      {/* Scrolls horizontally on narrow screens rather than crushing columns —
          an unreadable four-column table is worse than a scrollable one. */}
      <div className={styles.scroller}>
        <table className={styles.table}>
          <caption className="visually-hidden">{t.compare.title}</caption>
          <thead>
            <tr>
              <th scope="col" className={styles.rowHead}>
                <span className="visually-hidden">{t.compare.attribute}</span>
              </th>
              {products.map((p) => (
                <th scope="col" key={p.id} className={styles.productHead}>
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
            {ROWS.map((row) => {
              const cells = products.map((p) => valueFor(p, row));
              const allSame = cells.every((c) => String(c.raw) === String(cells[0].raw));

              // Only mark a winner when the row is numeric, has a direction, and
              // the values actually differ.
              const numbers = cells.map((c) => (typeof c.raw === 'number' ? c.raw : null));
              const comparable = row.higher !== undefined && numbers.every((n) => n !== null) && !allSame;
              const best = comparable
                ? row.higher
                  ? Math.max(...numbers)
                  : Math.min(...numbers)
                : null;

              return (
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
              );
            })}
          </tbody>
        </table>
      </div>

      <p className={styles.legend}>{t.compare.legend}</p>
    </main>
  );
}
