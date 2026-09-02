import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Checkout.module.css';

const paymentMethods = [
  { id: 'visa', label: 'Visa' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'applepay', label: 'Apple Pay' }
];

export default function Checkout() {
  const { lang, t } = useLanguage();
  const { lineItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', address: '', city: '', phone: '' });
  const [payment, setPayment] = useState('visa');

  if (lineItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderId = Math.floor(1000 + Math.random() * 9000);
    clearCart();
    navigate('/confirmation', { state: { orderId } });
  };

  return (
    <main className={`container ${styles.page}`}>
      <h1>{t.checkout.title}</h1>
      <p className={styles.demoNotice}>{t.checkout.demoNotice}</p>

      <form className={styles.layout} onSubmit={handleSubmit}>
        <div className={styles.formCol}>
          <section className={styles.block}>
            <h2>{t.checkout.shippingInfo}</h2>
            <label className={styles.field}>
              <span>{t.checkout.fullName}</span>
              <input required value={form.fullName} onChange={update('fullName')} />
            </label>
            <label className={styles.field}>
              <span>{t.checkout.address}</span>
              <input required value={form.address} onChange={update('address')} />
            </label>
            <div className={styles.fieldRow}>
              <label className={styles.field}>
                <span>{t.checkout.city}</span>
                <input required value={form.city} onChange={update('city')} />
              </label>
              <label className={styles.field}>
                <span>{t.checkout.phone}</span>
                <input required type="tel" value={form.phone} onChange={update('phone')} />
              </label>
            </div>
          </section>

          <section className={styles.block}>
            <h2>{t.checkout.payment}</h2>
            <div className={styles.paymentOptions}>
              {paymentMethods.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={`${styles.paymentOption} ${payment === m.id ? styles.paymentActive : ''}`}
                  onClick={() => setPayment(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {payment !== 'applepay' && (
              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span>{t.checkout.cardNumber}</span>
                  <input placeholder="4242 4242 4242 4242" />
                </label>
                <label className={styles.field} style={{ maxWidth: 110 }}>
                  <span>{t.checkout.expiry}</span>
                  <input placeholder="MM/YY" />
                </label>
                <label className={styles.field} style={{ maxWidth: 90 }}>
                  <span>{t.checkout.cvc}</span>
                  <input placeholder="123" />
                </label>
              </div>
            )}
          </section>
        </div>

        <aside className={styles.summary}>
          <h2>{t.checkout.orderSummary}</h2>
          <ul className={styles.summaryList}>
            {lineItems.map(({ id, qty, product }) => (
              <li key={id}>
                <span>{product.name[lang]} × {qty}</span>
                <span>${product.price * qty}</span>
              </li>
            ))}
          </ul>
          <div className={styles.totalRow}>
            <span>{t.cart.total}</span>
            <span>${subtotal}</span>
          </div>
          <Button type="submit" variant="primary" fullWidth>
            {t.checkout.placeOrder}
          </Button>
        </aside>
      </form>
    </main>
  );
}
