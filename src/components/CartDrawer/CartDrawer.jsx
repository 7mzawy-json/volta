import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import ProductGlyph from '../ProductGlyph/ProductGlyph.jsx';
import Button from '../Button/Button.jsx';
import styles from './CartDrawer.module.css';
import { formatPrice } from '../../utils/currency.js';

export default function CartDrawer() {
  const { lang, t } = useLanguage();
  const { lineItems, subtotal, count, updateQty, removeItem, isDrawerOpen, closeDrawer } = useCart();
  const navigate = useNavigate();

  const goToCheckout = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <>
      {isDrawerOpen && <button className={styles.scrim} aria-hidden="true" onClick={closeDrawer} />}
      <aside className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ''}`} aria-hidden={!isDrawerOpen}>
        <div className={styles.header}>
          <h3>{t.cart.title} {count > 0 && `(${count})`}</h3>
          <button type="button" className={styles.closeBtn} onClick={closeDrawer} aria-label="close">
            ✕
          </button>
        </div>

        {lineItems.length === 0 ? (
          <div className={styles.empty}>
            <p>{t.cart.empty}</p>
            <Button variant="secondary" to="/products" onClick={closeDrawer}>
              {t.cart.browse}
            </Button>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {lineItems.map(({ id, qty, product }) => (
                <li key={id} className={styles.item}>
                  <div className={styles.itemGlyph}>
                    <ProductGlyph icon={product.icon} size={40} />
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{product.name[lang]}</p>
                    <div className={styles.qtyRow}>
                      <button type="button" onClick={() => updateQty(id, qty - 1)}>−</button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => updateQty(id, qty + 1)}>+</button>
                    </div>
                  </div>
                  <div className={styles.itemEnd}>
                    <span className={styles.itemPrice}>{formatPrice(product.price * qty, lang)}</span>
                    <button type="button" className={styles.removeBtn} onClick={() => removeItem(id)}>
                      {t.cart.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.footer}>
              <div className={styles.subtotalRow}>
                <span>{t.cart.subtotal}</span>
                <span>{formatPrice(subtotal, lang)}</span>
              </div>
              <Button variant="primary" fullWidth onClick={goToCheckout}>
                {t.cart.checkout}
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
