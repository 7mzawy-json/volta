import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { getProduct, getRelated, getDefaultVariant, hasVariantChoice } from '../../data/products.js';
import ProductGlyph from '../../components/ProductGlyph/ProductGlyph.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Product.module.css';
import { formatPrice } from '../../utils/currency.js';

const LOW_STOCK_AT = 5;

export default function Product() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const { toggle, isFavorited } = useWishlist();

  const product = getProduct(id);
  // Keyed by product id so that navigating between listings resets the choice
  // instead of carrying the previous product's selection across.
  const [selectedId, setSelectedId] = useState(() =>
    product ? getDefaultVariant(product).id : null
  );
  const [pickedFor, setPickedFor] = useState(id);
  const [qty, setQty] = useState(1);

  if (!product) return <Navigate to="/products" replace />;

  if (pickedFor !== id) {
    setPickedFor(id);
    setSelectedId(getDefaultVariant(product).id);
    setQty(1);
  }

  const variant =
    product.variants.find((v) => v.id === selectedId) || getDefaultVariant(product);
  const related = getRelated(id);
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
          <ProductGlyph icon={product.icon} size={180} />
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

          {hasVariantChoice(product) && (
            <div className={styles.variants}>
              <p className={styles.variantLabel}>{t.product.storage}</p>
              <div className={styles.variantRow} role="group" aria-label={t.product.storage}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`${styles.variantBtn} ${v.id === variant.id ? styles.variantActive : ''}`}
                    onClick={() => { setSelectedId(v.id); setQty(1); }}
                    disabled={v.stock === 0}
                    aria-pressed={v.id === variant.id}
                  >
                    {v.label ? v.label[lang] : product.name[lang]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ul className={styles.specs}>
            {product.specs[lang].map((spec, i) => (
              <li key={i}>{spec}</li>
            ))}
          </ul>

          <div className={styles.actionRow}>
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
            <Button
              variant="primary"
              onClick={() => addItem(variant.id, qty)}
              disabled={!inStock}
            >
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
    </main>
  );
}
