import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  products,
  categories,
  brandLabels,
  getPriceRange,
  getFacets,
  getFacetOptions,
  productMatchesFacet
} from '../../data/products.js';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import { plural } from '../../utils/plural.js';
import styles from './Products.module.css';

export default function Products() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';

  const facets = getFacets(activeCategory);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' || !value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  // Switching category clears facet selections: a storage filter means nothing
  // once you are browsing chargers, and leaving it set would silently hide stock.
  const setCategory = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('category');
    else next.set('category', value);
    for (const facet of facets) next.delete(facet.id);
    setSearchParams(next, { replace: true });
  };

  const selectedFor = (facetId) => {
    const raw = searchParams.get(facetId);
    return raw ? raw.split(',') : [];
  };

  const toggleFacetValue = (facetId, value) => {
    const current = selectedFor(facetId);
    const str = String(value);
    const next = current.includes(str)
      ? current.filter((v) => v !== str)
      : [...current, str];

    const params = new URLSearchParams(searchParams);
    if (next.length) params.set(facetId, next.join(','));
    else params.delete(facetId);
    setSearchParams(params, { replace: true });
  };

  const clearFacets = () => {
    const params = new URLSearchParams(searchParams);
    for (const facet of facets) params.delete(facet.id);
    setSearchParams(params, { replace: true });
  };

  const activeFacetCount = facets.reduce((n, f) => n + selectedFor(f.id).length, 0);

  // Products matching category and search, before any facet is applied.
  const beforeFacets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const matchesQuery = q
        ? p.name.ar.includes(query) ||
          p.name.en.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
        : true;
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const filtered = useMemo(() => {
    let list = beforeFacets.filter((p) =>
      facets.every((facet) => productMatchesFacet(p, facet, selectedFor(facet.id)))
    );

    const cheapest = (p) => getPriceRange(p).min;
    if (sort === 'price-low') list = [...list].sort((a, b) => cheapest(a) - cheapest(b));
    if (sort === 'price-high') list = [...list].sort((a, b) => cheapest(b) - cheapest(a));

    return list;
    // searchParams drives the facet selections, so it belongs in the deps.
  }, [beforeFacets, facets, sort, searchParams]);

  // Counts for one facet are computed against everything matching the OTHER
  // facets but not this one. Narrowing by the facet's own selection would drive
  // every unpicked option to zero and make it unpickable; ignoring the other
  // facets would promise more than the filter can deliver — "1TB (2)" while
  // Apple is selected, when only one of those two is an iPhone.
  const populationFor = (facet) =>
    beforeFacets.filter((p) =>
      facets.every(
        (other) => other.id === facet.id || productMatchesFacet(p, other, selectedFor(other.id))
      )
    );

  const facetValueLabel = (facet, value) => {
    if (facet.id === 'brand') return brandLabels[value] || value;
    if (t.facets.values[value]) return t.facets.values[value];
    return facet.suffix ? `${value}${facet.suffix}` : String(value);
  };

  return (
    <main className={`container ${styles.page}`}>
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeCategory === 'all' ? styles.tabActive : ''}`}
            onClick={() => setCategory('all')}
          >
            {t.filters.all}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setCategory(cat)}
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

      <div className={facets.length ? styles.layout : ''}>
        {facets.length > 0 && (
          <aside className={styles.filters} aria-label={t.facets.title}>
            <div className={styles.filtersHead}>
              <h2 className={styles.filtersTitle}>{t.facets.title}</h2>
              {activeFacetCount > 0 && (
                <button type="button" className={styles.clearBtn} onClick={clearFacets}>
                  {t.facets.clear}
                </button>
              )}
            </div>

            {facets.map((facet) => {
              const options = getFacetOptions(facet, populationFor(facet));
              if (!options.length) return null;
              const selected = selectedFor(facet.id);

              return (
                <fieldset key={facet.id} className={styles.facet}>
                  <legend className={styles.facetLegend}>{t.facets[facet.id]}</legend>
                  {options.map(({ value, count }) => {
                    const str = String(value);
                    const checked = selected.includes(str);
                    return (
                      <label key={str} className={styles.facetOption}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFacetValue(facet.id, value)}
                        />
                        <span className={styles.facetName}>{facetValueLabel(facet, value)}</span>
                        <span className={styles.facetCount}>{count}</span>
                      </label>
                    );
                  })}
                </fieldset>
              );
            })}
          </aside>
        )}

        <div className={styles.results}>
          <p className={styles.resultCount}>
            {filtered.length} {plural(t.facets.results, filtered.length, lang)}
          </p>

          {filtered.length === 0 ? (
            <p className={styles.noResults}>{t.misc.noResults}</p>
          ) : (
            <div className={styles.grid}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
