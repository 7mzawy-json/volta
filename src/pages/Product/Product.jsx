import { useState, useRef, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import {
  getProduct,
  getRelated,
  getDefaultVariant,
  getStorageOptions,
  getProductColors,
  getCompanions
} from '../../data/products.js';
import { getColor } from '../../data/colors.js';
import ProductGlyph from '../../components/ProductGlyph/ProductGlyph.jsx';
import DeviceRender from '../../components/DeviceRender/DeviceRender.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import Button from '../../components/Button/Button.jsx';
import StickyBuyBar from '../../components/StickyBuyBar/StickyBuyBar.jsx';
import styles from './Product.module.css';
import { formatPrice } from '../../utils/currency.js';

const LOW_STOCK_AT = 5;

export default function Product() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const { toggle, isFavorited } = useWishlist();

  const product = getProduct(id);
  const fallback = product ? getDefaultVariant(product) : null;

  // Storage and colour are chosen independently and resolve to one variant, so a
  // 3 x 3 matrix is two short rows rather than nine identical-looking buttons.
  const [storage, setStorage] = useState(fallback?.storage);
  const [color, setColor] = useState(fallback?.color);
  const [pickedFor, setPickedFor] = useState(id);
  const [qty, setQty] = useState(1);
  // The sticky buy bar appears once this row scrolls above the viewport. The
  // page owns both the element and the decision — handing a ref to the bar and
  // letting it observe across a component boundary silently never fired.
  const actionRowRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const el = actionRowRef.current;
    if (!el) return;

    // Measure live rather than trusting entry.boundingClientRect, which is a
    // snapshot from when the intersection was recorded and lags a fast jump.
    const update = () => setShowStickyBar(el.getBoundingClientRect().bottom < 0);

    // Two triggers on purpose, and they are not redundant:
    //   - IntersectionObserver is the right primitive for "has this element left
    //     the viewport" and fires on layout changes that emit no scroll event.
    //   - a passive scroll listener covers the case where the observer delivers
    //     nothing. That is not hypothetical: in the automation pane used to test
    //     this, IO delivered zero callbacks — not even the initial one the spec
    //     requires — because the pane was not painting.
    // Both call the same idempotent update, so whichever fires first wins and a
    // duplicate call is harmless.
    const observer = new IntersectionObserver(update, { threshold: 0 });
    observer.observe(el);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [id]);

  if (!product) return <Navigate to="/products" replace />;

  // Navigating between listings resets the selection rather than carrying the
  // previous product's choice across.
  if (pickedFor !== id) {
    setPickedFor(id);
    setStorage(fallback.storage);
    setColor(fallback.color);
    setQty(1);
  }

  const storages = getStorageOptions(product);
  const colorways = getProductColors(product);
  const isPhone = product.category === 'phones';

  const variant =
    product.variants.find((v) => v.storage === storage && v.color === color) || fallback;

  const stockFor = (nextStorage, nextColor) =>
    product.variants.find((v) => v.storage === nextStorage && v.color === nextColor)?.stock ?? 0;

  // Neither axis is ever disabled. Disabling 2TB because it is sold out in the
  // currently selected colour strands anyone who came for 2TB — they would have
  // to guess that changing colour unlocks it. Instead the axis you click wins,
  // and the other one moves to a combination that exists.
  const chooseStorage = (next) => {
    setStorage(next);
    if (stockFor(next, color) === 0) {
      const alt = colorways.find((c) => stockFor(next, c) > 0);
      if (alt) setColor(alt);
    }
    setQty(1);
  };

  const chooseColor = (next) => {
    setColor(next);
    if (stockFor(storage, next) === 0) {
      const alt = storages.find((s) => stockFor(s, next) > 0);
      if (alt) setStorage(alt);
    }
    setQty(1);
  };

  const related = getRelated(id);
  const companions = getCompanions(id);
  const favorited = isFavorited(product.id);
  const inStock = variant.stock > 0;
  const low = inStock && variant.stock <= LOW_STOCK_AT;

  return (
    <main className={`container ${styles.page}`}>
      <Link to="/products" className={styles.back}>
        {/* Arrows are not mirrored by the bidi algorithm, so "back" has to be
            flipped explicitly: in RTL it points right, toward the way you came. */}
        {lang === 'ar' ? '→' : '←'} {t.product.backToProducts}
      </Link>

      <div className={styles.layout}>
        <div className={styles.visual}>
          <div className={styles.glow} />
          {isPhone ? (
            <DeviceRender
              color={variant.color}
              brand={product.brand}
              wide={product.attributes?.screen >= 7.5}
              size={150}
            />
          ) : (
            <ProductGlyph icon={product.icon} size={180} />
          )}
          {product.badge && <span className={styles.badge}>{product.badge[lang]}</span>}
        </div>

        <div className={styles.details}>
          <p className={styles.category}>{t.categories[product.category]}</p>
          <h1 className={styles.name}>{product.name[lang]}</h1>
          <p className={styles.price}>{formatPrice(variant.price, lang)}</p>
          <p className={styles.description}>{product.description[lang]}</p>

          {inStock ? (
            <p className={low ? styles.stockLow : styles.stock}>
              ● {low ? t.product.lowStock : t.product.inStock}
            </p>
          ) : (
            <p className={styles.stockOut}>● {t.product.outOfStock}</p>
          )}

          {storages.length > 1 && (
            <div className={styles.variants}>
              <p className={styles.variantLabel}>{t.product.storage}</p>
              <div className={styles.variantRow} role="group" aria-label={t.product.storage}>
                {storages.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`${styles.variantBtn} ${size === variant.storage ? styles.variantActive : ''} ${stockFor(size, color) === 0 ? styles.variantDead : ''}`}
                    onClick={() => chooseStorage(size)}
                    aria-pressed={size === variant.storage}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colorways.length > 1 && (
            <div className={styles.variants}>
              <p className={styles.variantLabel}>
                {t.facets.color}
                <span className={styles.colorName}>{getColor(variant.color).name[lang]}</span>
              </p>
              <div className={styles.swatchRow} role="group" aria-label={t.facets.color}>
                {colorways.map((c) => {
                  const dead = stockFor(storage, c) === 0;
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.swatch} ${c === variant.color ? styles.swatchOn : ''} ${dead ? styles.swatchDead : ''}`}
                      style={{ background: getColor(c).hex }}
                      onClick={() => chooseColor(c)}
                      aria-pressed={c === variant.color}
                      aria-label={getColor(c).name[lang]}
                      title={getColor(c).name[lang]}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <ul className={styles.specs}>
            {product.specs[lang].map((spec, i) => (
              <li key={i}>{spec}</li>
            ))}
          </ul>

          <div className={styles.actionRow} ref={actionRowRef}>
            <div className={styles.qtyPicker}>
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(q + 1, variant.stock || 1))}
              >
                +
              </button>
            </div>
            <Button variant="primary" onClick={() => addItem(variant.id, qty)} disabled={!inStock}>
              {inStock ? t.product.addToCart : t.product.outOfStock}
            </Button>
            <button
              type="button"
              className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
              onClick={() => toggle(product.id)}
              aria-pressed={favorited}
              aria-label={t.nav.wishlist}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7.5-4.9-10-9.3C.5 8.2 2.2 4.5 6 4.5c2.1 0 3.7 1.2 4.5 2.7C11.3 5.7 12.9 4.5 15 4.5c3.8 0 5.5 3.7 4 7.2C19.5 16.1 12 21 12 21z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {companions.length > 0 && (
        <section className={styles.related}>
          <h2>{t.product.companions}</h2>
          <div className={styles.relatedGrid}>
            {companions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className={styles.related}>
          <h2>{t.product.related}</h2>
          <div className={styles.relatedGrid}>
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <StickyBuyBar show={showStickyBar}>
        <div className={styles.stickyInfo}>
          <span className={styles.stickyName}>{product.name[lang]}</span>
          <span className={styles.stickyPrice}>{formatPrice(variant.price, lang)}</span>
        </div>
        <Button variant="primary" onClick={() => addItem(variant.id, qty)} disabled={!inStock}>
          {inStock ? t.product.addToCart : t.product.outOfStock}
        </Button>
      </StickyBuyBar>
    </main>
  );
}
