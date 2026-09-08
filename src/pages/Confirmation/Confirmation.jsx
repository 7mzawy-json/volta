import { useLocation, Navigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useMoney } from '../../context/CurrencyContext.jsx';
import { getColor } from '../../data/colors.js';
import BoltMark from '../../components/BoltMark/BoltMark.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Confirmation.module.css';

export default function Confirmation() {
  const { lang, t } = useLanguage();
  const money = useMoney();
  const location = useLocation();
  const order = location.state?.order;

  // Previously this page invented an order number with Math.random() whenever it
  // was opened directly. That fabricates a record: a shopper who bookmarks or
  // refreshes the URL is shown a confirmation for a purchase that never happened,
  // with a different number every time. A confirmation with no order behind it is
  // not a confirmation, so a direct visit goes back to the cart instead.
  if (!order) return <Navigate to="/cart" replace />;

  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.boltWrap}>
        <BoltMark size={64} glow />
      </div>
      <h1>{t.confirmation.title}</h1>
      <p className={styles.message}>
        {t.confirmation.message} <span className={styles.orderId}>#{order.id}</span>{' '}
        {t.confirmation.onTheWay}
      </p>

      {/* docs/user-flow.md promises a summary at this stage: the last thing a
          shopper sees should confirm WHAT was bought, not only that something was. */}
      <section className={styles.summary} aria-label={t.checkout.orderSummary}>
        <h2 className={styles.summaryTitle}>{t.checkout.orderSummary}</h2>
        <ul className={styles.summaryList}>
          {order.lines.map((line) => (
            <li key={line.variantId}>
              <span className={styles.lineName}>
                {line.name[lang]}
                {line.color && (
                  <span className={styles.lineVariant}>
                    {[line.storage, getColor(line.color).name[lang]].filter(Boolean).join(' · ')}
                  </span>
                )}
                {!line.color && line.storage && (
                  <span className={styles.lineVariant}>{line.storage}</span>
                )}
              </span>
              <span className={styles.lineQty}>× {line.qty}</span>
              <span className={styles.lineTotal}>{money(line.price * line.qty)}</span>
            </li>
          ))}
        </ul>
        <div className={styles.totalRow}>
          <span>{t.cart.total}</span>
          <span>{money(order.total)}</span>
        </div>
      </section>

      <Button variant="primary" to="/products">
        {t.confirmation.continue}
      </Button>
    </main>
  );
}
