import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useMoney } from '../../context/CurrencyContext.jsx';
import { searchProducts } from '../../data/search.js';
import { getPriceRange, getProductColors } from '../../data/products.js';
import ProductVisual from '../ProductVisual/ProductVisual.jsx';
import styles from './SearchBox.module.css';

// Search with live suggestions.
//
// Built as a combobox rather than a styled input with a div under it: the
// listbox/option roles and aria-activedescendant are what let a screen reader
// announce "3 of 6" as you arrow through, and they are the difference between a
// dropdown that works and one that merely looks like it does. Focus deliberately
// stays in the input the whole time — arrow keys move a highlight, not focus.

export default function SearchBox({ className = '', onNavigate }) {
  const { lang, t } = useLanguage();
  const money = useMoney();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const listId = useId();

  const [query, setQuery] = useState(
    location.pathname === '/products' ? searchParams.get('q') || '' : ''
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef(null);

  const results = open ? searchProducts(query) : [];

  // Leaving the listing clears the box, so a stale term does not sit in the nav
  // describing results you are no longer looking at.
  useEffect(() => {
    if (location.pathname !== '/products') setQuery('');
    setOpen(false);
    setActive(-1);
  }, [location.pathname, location.search]);

  // Any click outside dismisses the panel.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const goToProduct = (product) => {
    setOpen(false);
    setQuery('');
    onNavigate?.();
    navigate(`/products/${product.id}`);
  };

  const goToResults = () => {
    setOpen(false);
    onNavigate?.();
    navigate(`/products?q=${encodeURIComponent(query)}`);
  };

  const onChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    setActive(-1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && results[active]) goToProduct(results[active]);
      else if (query.trim()) goToResults();
      return;
    }
    if (!results.length) return;
    // Arrow keys move the highlight only; focus never leaves the input, which is
    // what the combobox pattern requires.
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className}`}>
      <div className={styles.field}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder={t.nav.searchPlaceholder}
          className={styles.input}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        />
      </div>

      {showPanel && (
        <div className={styles.panel}>
          {results.length === 0 ? (
            <p className={styles.empty}>{t.misc.noResults}</p>
          ) : (
            <>
              <ul className={styles.list} id={listId} role="listbox" aria-label={t.nav.searchPlaceholder}>
                {results.map((p, i) => {
                  const isPhone = p.category === 'phones';
                  return (
                    <li
                      key={p.id}
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      className={`${styles.item} ${i === active ? styles.itemActive : ''}`}
                      onMouseEnter={() => setActive(i)}
                      // preventDefault on mousedown keeps focus in the input, so
                      // the panel is still open when the click arrives; the
                      // click itself is what navigates.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => goToProduct(p)}
                    >
                      <span className={styles.thumb}>
                        <ProductVisual product={p} size={isPhone ? 20 : 26} />
                      </span>
                      <span className={styles.itemName}>{p.name[lang]}</span>
                      <span className={styles.itemPrice}>
                        {money(getPriceRange(p).min)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {/* onClick, not onMouseDown. It navigated on mousedown only, so a
                  keyboard user could tab to this button and press Enter or Space
                  and nothing at all happened — both dispatch a click, and there
                  was no click handler. preventDefault on mousedown is kept for
                  the reason above: it holds focus, it does not navigate. */}
              <button
                type="button"
                className={styles.seeAll}
                onMouseDown={(e) => e.preventDefault()}
                onClick={goToResults}
              >
                {t.nav.seeAllResults}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
