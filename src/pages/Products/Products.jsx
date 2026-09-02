import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { products, categories, getPriceRange } from '../../data/products.js';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import styles from './Products.module.css';

export default function Products() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesQuery = query.trim()
        ? p.name.ar.includes(query) || p.name.en.toLowerCase().includes(query.toLowerCase())
        : true;
      return matchesCategory && matchesQuery;
    });

    const cheapest = (p) => getPriceRange(p).min;
    if (sort === 'price-low') list = [...list].sort((a, b) => cheapest(a) - cheapest(b));
    if (sort === 'price-high') list = [...list].sort((a, b) => cheapest(b) - cheapest(a));

    return list;
  }, [query, activeCategory, sort]);

  return (
    <main className={`container ${styles.page}`}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeCategory === 'all' ? styles.tabActive : ''}`}
            onClick={() => setParam('category', 'all')}
          >
            {t.filters.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setParam('category', cat)}
            >
              {t.categories[cat]}
            </button>
          ))}
        </div>

        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
          aria-label={t.filters.sortLabel}
        >
          <option value="newest">{t.filters.newest}</option>
          <option value="price-low">{t.filters.priceLowHigh}</option>
          <option value="price-high">{t.filters.priceHighLow}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className={styles.noResults}>{t.misc.noResults}</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
