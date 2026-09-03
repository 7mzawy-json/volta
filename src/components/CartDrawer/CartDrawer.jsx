import { useNavigate } from 'react-router-dom';
import { useDialog } from '../../hooks/useDialog.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import ProductVisual from '../ProductVisual/ProductVisual.jsx';
import Button from '../Button/Button.jsx';
import styles from './CartDrawer.module.css';
import { variantLabel } from '../../data/products.js';
import { getColor } from '../../data/colors.js';
import { formatPrice } from '../../utils/currency.js';

export default function CartDrawer() {
  const { lang, t } = useLanguage();
  const { lineItems, subtotal, count, updateQty, removeItem, isDrawerOpen, closeDrawer } = useCart();
  const navigate = useNavigate();
  // Escape, initial focus, focus containment, focus restore, scroll lock.
  const dialogRef = useDialog(isDrawerOpen, closeDrawer);

  const goToCheckout = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <>
      {isDrawerOpen && <button className={styles.scrim} aria-hidden="true" onClick={closeDrawer} />}
      <aside
        ref={dialogRef}
        className={`${styles.drawer} ${isDrawerOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.cart.title}
        tabIndex={-1}
        // Kept out of the tab order entirely while closed: aria-hidden alone
        // still leaves the controls focusable behind the page.
        inert={isDrawerOpen ? undefined : ''}
      >
        <div className={styles.header}>
          <h3>{t.cart.title} {count > 0 && `(${count})`}</h3>
          <button type="button" className={styles.closeBtn} onClick={closeDrawer} aria-label={t.misc.close}>
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
              {lineItems.map(({ variantId, qty, product, variant }) => (
                <li key={variantId} className={styles.item}>
                  <div className={styles.itemGlyph}>
                    <ProductVisual product={product} color={variant.color} size={product.category === 'phones' ? 26 : 40} />
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{product.name[lang]}</p>
                    {variantLabel(variant, variant.color && getColor(variant.color).name[lang]) && (
                      <p className={styles.itemVariant}>
                        {variantLabel(variant, variant.color && getColor(variant.color).name[lang])}
                      </p>
                    )}
                    <div className={styles.qtyRow}>
                      <button type="button" onClick={() => updateQty(variantId, qty - 1)}>−</button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => updateQty(variantId, qty + 1)}>+</button>
                    </div>
                  </div>
                  <div className={styles.itemEnd}>
                    <span className={styles.itemPrice}>{formatPrice(variant.price * qty, lang)}</span>
                    <button type="button" className={styles.removeBtn} onClick={() => removeItem(variantId)}>
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
