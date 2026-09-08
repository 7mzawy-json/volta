import { useLanguage } from '../../context/LanguageContext.jsx';
import { useMoney } from '../../context/CurrencyContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import ProductVisual from '../../components/ProductVisual/ProductVisual.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Cart.module.css';
import { variantLabel } from '../../data/products.js';
import { getColor } from '../../data/colors.js';

export default function Cart() {
  const { lang, t } = useLanguage();
  const money = useMoney();
  const { lineItems, subtotal, updateQty, removeItem } = useCart();

  if (lineItems.length === 0) {
    return (
      <main className={`container ${styles.emptyPage}`}>
        <h1>{t.cart.title}</h1>
        <p>{t.cart.empty}</p>
        <Button variant="primary" to="/products">
          {t.cart.browse}
        </Button>
      </main>
    );
  }

  return (
    <main className={`container ${styles.page}`}>
      <h1>{t.cart.title}</h1>

      <div className={styles.layout}>
        <ul className={styles.list}>
          {lineItems.map(({ variantId, qty, product, variant }) => (
            <li key={variantId} className={styles.item}>
              <div className={styles.glyphBox}>
                <ProductVisual product={product} color={variant.color} size={product.category === 'phones' ? 30 : 48} />
              </div>
              <div className={styles.info}>
                <p className={styles.name}>{product.name[lang]}</p>
                {variantLabel(variant, variant.color && getColor(variant.color).name[lang]) && (
                  <p className={styles.variantName}>
                    {variantLabel(variant, variant.color && getColor(variant.color).name[lang])}
                  </p>
                )}
                <p className={styles.unitPrice}>{money(variant.price)}</p>
              </div>
              <div className={styles.qtyPicker}>
                <button type="button" onClick={() => updateQty(variantId, qty - 1)}>−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => updateQty(variantId, qty + 1)}>+</button>
              </div>
              <p className={styles.lineTotal}>{money(variant.price * qty)}</p>
              <button type="button" className={styles.removeBtn} onClick={() => removeItem(variantId)}>
                {t.cart.remove}
              </button>
            </li>
          ))}
        </ul>

        <aside className={styles.summary}>
          <h2>{t.checkout.orderSummary}</h2>
          <div className={styles.row}>
            <span>{t.cart.subtotal}</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className={styles.row}>
            <span>{t.cart.shipping}</span>
            <span className={styles.free}>{t.cart.free}</span>
          </div>
          <div className={`${styles.row} ${styles.totalRow}`}>
            <span>{t.cart.total}</span>
            <span>{money(subtotal)}</span>
          </div>
          <Button variant="primary" to="/checkout" fullWidth>
            {t.cart.checkout}
          </Button>
          <Button variant="secondary" to="/products" fullWidth>
            {t.cart.continueShopping}
          </Button>
        </aside>
      </div>
    </main>
  );
}
