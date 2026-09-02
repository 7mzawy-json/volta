import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import ProductGlyph from '../ProductGlyph/ProductGlyph.jsx';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const { toggle, isFavorited } = useWishlist();
  const favorited = isFavorited(product.id);

  const handleAdd = (e) => {
    e.preventDefault();
    addItem(product.id, 1);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    toggle(product.id);
  };

  return (
    <Link to={`/products/${product.id}`} className={styles.card}>
      <div className={styles.visual}>
        <ProductGlyph icon={product.icon} size={72} className={styles.glyph} />
        {product.badge && <span className={styles.badge}>{product.badge[lang]}</span>}
        <button
          type="button"
          className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
          onClick={handleFavorite}
          aria-pressed={favorited}
          aria-label={t.nav.wishlist}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7.5-4.9-10-9.3C.5 8.2 2.2 4.5 6 4.5c2.1 0 3.7 1.2 4.5 2.7C11.3 5.7 12.9 4.5 15 4.5c3.8 0 5.5 3.7 4 7.2C19.5 16.1 12 21 12 21z" />
          </svg>
        </button>
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{product.name[lang]}</p>
        <div className={styles.bottomRow}>
          <span className={styles.price}>${product.price}</span>
          <button type="button" className={styles.quickAdd} onClick={handleAdd} aria-label={t.product.addToCart}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H7" />
              <circle cx="10" cy="21" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="18" cy="21" r="1.4" fill="currentColor" stroke="none" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
