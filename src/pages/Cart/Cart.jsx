import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import ProductGlyph from '../../components/ProductGlyph/ProductGlyph.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Cart.module.css';

export default function Cart() {
  const { lang, t } = useLanguage();
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
          {lineItems.map(({ id, qty, product }) => (
            <li key={id} className={styles.item}>
              <div className={styles.glyphBox}>
                <ProductGlyph icon={product.icon} size={48} />
              </div>
              <div className={styles.info}>
                <p className={styles.name}>{product.name[lang]}</p>
                <p className={styles.unitPrice}>${product.price}</p>
              </div>
              <div className={styles.qtyPicker}>
                <button type="button" onClick={() => updateQty(id, qty - 1)}>−</button>
                <span>{qty}</span>
                <button type="button" onClick={() => updateQty(id, qty + 1)}>+</button>
              </div>
              <p className={styles.lineTotal}>${product.price * qty}</p>
              <button type="button" className={styles.removeBtn} onClick={() => removeItem(id)}>
                {t.cart.remove}
              </button>
            </li>
          ))}
        </ul>

        <aside className={styles.summary}>
          <h2>{t.checkout.orderSummary}</h2>
          <div className={styles.row}>
            <span>{t.cart.subtotal}</span>
            <span>${subtotal}</span>
          </div>
          <div className={styles.row}>
            <span>{t.cart.shipping}</span>
            <span className={styles.free}>{t.cart.free}</span>
          </div>
          <div className={`${styles.row} ${styles.totalRow}`}>
            <span>{t.cart.total}</span>
            <span>${subtotal}</span>
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
