import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  products,
  categories,
  brandLabels,
  getPriceRange,
  getFacets,
  getFacetOptions,
  productMatchesFacet,
  productMatchesPrice,
  getPriceBounds
} from '../../data/products.js';
import { getColor } from '../../data/colors.js';
import { matchesQuery } from '../../data/search.js';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import PriceRange from '../../components/PriceRange/PriceRange.jsx';
import { plural } from '../../utils/plural.js';
import { useDialog } from '../../hooks/useDialog.js';
import styles from './Products.module.css';

// Listing pages must not render an unbounded grid: at a few thousand products
// that is thousands of DOM nodes and a frozen tab. Paging keeps render cost flat
// however far the catalogue grows.
const PAGE_SIZE = 12;

export default function Products() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';

  const facets = getFacets(activeCategory);
  const toggleFacets = facets.filter((f) => f.type !== 'range');

  const [visible, setVisible] = useState(PAGE_SIZE);

  // On a phone the facet stack ran ~989px before the first product — a full
  // screen and a half of filters in front of the thing the shopper came for. On
  // that tier the panel becomes a drawer opened from a button; from tablet up it
  // is the persistent sidebar it always was.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const filtersRef = useDialog(filtersOpen, closeFilters);

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
    const next = current.includes(str) ? current.filter((v) => v !== str) : [...current, str];
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

  // Everything matching category and search, before any facet applies.
  //
  // The search predicate is the SAME one the dropdown uses. It used to be a
  // second, narrower copy — names and brands only — so a query the dropdown
  // answered with six phones ("256GB") produced an empty listing when submitted.
  const beforeFacets = useMemo(
    () =>
      products.filter(
        (p) => (activeCategory === 'all' || p.category === activeCategory) && matchesQuery(p, query)
      ),
    [query, activeCategory]
  );

  const bounds = useMemo(() => getPriceBounds(beforeFacets), [beforeFacets]);

  const priceParam = searchParams.get('price');
  const priceRange = useMemo(() => {
    if (!priceParam) return null;
    const [lo, hi] = priceParam.split('-').map(Number);
    return Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : null;
  }, [priceParam]);

  const setPriceRange = (range) => {
    const params = new URLSearchParams(searchParams);
    // A range covering everything is not a filter, so it leaves no URL noise.
    if (!range || (range[0] <= bounds[0] && range[1] >= bounds[1])) params.delete('price');
    else params.set('price', `${range[0]}-${range[1]}`);
    setSearchParams(params, { replace: true });
  };

  const activeFacetCount =
    toggleFacets.reduce((n, f) => n + selectedFor(f.id).length, 0) + (priceRange ? 1 : 0);

  const filtered = useMemo(() => {
    let list = beforeFacets.filter(
      (p) =>
        toggleFacets.every((facet) => productMatchesFacet(p, facet, selectedFor(facet.id))) &&
        productMatchesPrice(p, priceRange)
    );

    const cheapest = (p) => getPriceRange(p).min;
    if (sort === 'price-low') list = [...list].sort((a, b) => cheapest(a) - cheapest(b));
    if (sort === 'price-high') list = [...list].sort((a, b) => cheapest(b) - cheapest(a));
    return list;
  }, [beforeFacets, toggleFacets, sort, searchParams, priceRange]);

  // Any change to what is being filtered returns the shopper to the first page,
  // otherwise page 3 of the old results silently becomes an empty screen.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, activeCategory, sort, priceParam, searchParams.toString()]);

  // Counts for one facet come from everything matching the OTHER facets but not
  // this one: narrowing by its own selection would drive every unpicked option
  // to zero and make it unpickable, while ignoring the others would overpromise.
  const populationFor = (facet) =>
    beforeFacets.filter(
      (p) =>
        toggleFacets.every(
          (other) => other.id === facet.id || productMatchesFacet(p, other, selectedFor(other.id))
        ) && productMatchesPrice(p, priceRange)
    );

  const facetValueLabel = (facet, value) => {
    if (facet.id === 'brand') return brandLabels[value] || value;
    if (facet.id === 'color') return getColor(value).name[lang];
    if (facet.id === 'screen') return t.facets.screens[value] || value;
    return facet.suffix ? `${value}${facet.suffix}` : String(value);
  };

  const shown = filtered.slice(0, visible);

  return (
    <main className={`container ${styles.page}`}>
      <h1 className={styles.srOnly}>{t.nav.products}</h1>
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
          <>
            <button
              type="button"
              className={styles.filterToggle}
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
            >
              {t.facets.title}
              {activeFacetCount > 0 && <span className={styles.filterCount}>{activeFacetCount}</span>}
            </button>

            {filtersOpen && (
              <button
                type="button"
                className={styles.filterScrim}
                aria-label={t.misc.close}
                onClick={closeFilters}
              />
            )}

            {/* One element, two things. From 768px up it is the page's filter
                sidebar — a complementary landmark. On a phone it is a modal
                drawer: it locks scrolling, traps focus and restores it on close,
                so it has to SAY it is a dialog. It did not, and assistive
                technology was handed an aside whose focus had silently moved
                into it. filtersOpen is only ever true in the drawer state. */}
            <aside
              ref={filtersRef}
              className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`}
              role={filtersOpen ? 'dialog' : undefined}
              aria-modal={filtersOpen ? 'true' : undefined}
              aria-label={t.facets.title}
              tabIndex={-1}
            >
              <button
                type="button"
                className={styles.filterClose}
                onClick={closeFilters}
                aria-label={t.misc.close}
              >
                ✕
              </button>
            <div className={styles.filtersHead}>
              <h2 className={styles.filtersTitle}>{t.facets.title}</h2>
              {activeFacetCount > 0 && (
                <button type="button" className={styles.clearBtn} onClick={clearFacets}>
                  {t.facets.clear}
                </button>
              )}
            </div>

            <div className={styles.facet}>
              <p className={styles.facetLegend}>{t.facets.price}</p>
              <PriceRange
                bounds={bounds}
                value={priceRange || bounds}
                onChange={setPriceRange}
                labels={{ min: t.misc.priceMin, max: t.misc.priceMax }}
              />
            </div>

            {toggleFacets.map((facet) => {
              const options = getFacetOptions(facet, populationFor(facet));
              if (!options.length) return null;
              const selected = selectedFor(facet.id);
              const isSwatch = facet.type === 'swatch';

              return (
                <fieldset key={facet.id} className={styles.facet}>
                  <legend className={styles.facetLegend}>{t.facets[facet.id]}</legend>

                  {isSwatch ? (
                    <div className={styles.swatchRow}>
                      {options.map(({ value, count }) => {
                        const checked = selected.includes(String(value));
                        const finish = getColor(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            className={`${styles.swatch} ${checked ? styles.swatchOn : ''}`}
                            style={{ background: finish.hex }}
                            onClick={() => toggleFacetValue(facet.id, value)}
                            aria-pressed={checked}
                            title={`${finish.name[lang]} (${count})`}
                          >
                            <span className={styles.srOnly}>
                              {finish.name[lang]} ({count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    options.map(({ value, count }) => {
                      const str = String(value);
                      const checked = selected.includes(str);
                      return (
                        <label key={str} className={styles.facetOption}>
                          <span className={styles.facetName}>{facetValueLabel(facet, value)}</span>
                          <span className={styles.facetCount}>{count}</span>
                          <input
                            type="checkbox"
                            className={styles.switchInput}
                            checked={checked}
                            onChange={() => toggleFacetValue(facet.id, value)}
                          />
                          <span className={styles.switch} aria-hidden="true">
                            <span className={styles.switchKnob} />
                          </span>
                        </label>
                      );
                    })
                  )}
                </fieldset>
              );
            })}
            </aside>
          </>
        )}

        <div className={styles.results}>
          <p className={styles.resultCount}>
            {filtered.length} {plural(t.facets.results, filtered.length, lang)}
          </p>

          {filtered.length === 0 ? (
            <p className={styles.noResults}>{t.misc.noResults}</p>
          ) : (
            <>
              <div className={styles.grid}>
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {visible < filtered.length && (
                <button
                  type="button"
                  className={styles.loadMore}
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  {t.filters.loadMore} ({filtered.length - visible})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
