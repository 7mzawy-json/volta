import { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { getProduct, getRelated } from '../../data/products.js';
import ProductGlyph from '../../components/ProductGlyph/ProductGlyph.jsx';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Product.module.css';

export default function Product() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const { toggle, isFavorited } = useWishlist();
  const [qty, setQty] = useState(1);

  const product = getProduct(id);
  if (!product) return <Navigate to="/products" replace />;

  const related = getRelated(id);
  const favorited = isFavorited(product.id);

  return (
    <main className={`container ${styles.page}`}>
      <Link to="/products" className={styles.back}>
        ← {t.product.backToProducts}
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
          <p className={styles.price}>${product.price}</p>
          <p className={styles.description}>{product.description[lang]}</p>
          <p className={styles.stock}>● {t.product.inStock}</p>

          <ul className={styles.specs}>
            {product.specs[lang].map((spec, i) => (
              <li key={i}>{spec}</li>
            ))}
          </ul>

          <div className={styles.actionRow}>
            <div className={styles.qtyPicker}>
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
            <Button variant="primary" onClick={() => addItem(product.id, qty)}>
              {t.product.addToCart}
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
