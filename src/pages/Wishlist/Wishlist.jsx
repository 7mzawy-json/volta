import { useLanguage } from '../../context/LanguageContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { products } from '../../data/products.js';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Wishlist.module.css';

export default function Wishlist() {
  const { t } = useLanguage();
  const { ids } = useWishlist();
  const favorited = products.filter((p) => ids.includes(p.id));

  return (
    <main className={`container ${styles.page}`}>
      <h1>{t.nav.wishlist}</h1>

      {favorited.length === 0 ? (
        <div className={styles.empty}>
          <p>{t.wishlist.empty}</p>
          <Button variant="primary" to="/products">
            {t.cart.browse}
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {favorited.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
