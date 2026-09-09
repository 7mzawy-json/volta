import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMoney } from '../../context/CurrencyContext.jsx';
import { api } from '../../api/client.js';
import Button from '../../components/Button/Button.jsx';
import OrderStatus from './OrderStatus.jsx';
import styles from './Orders.module.css';
import { filsToDinar } from './fils.js';

export default function Orders() {
  const { lang, t } = useLanguage();
  const { user, isReady } = useAuth();
  const money = useMoney();

  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    api
      .get('/orders')
      .then((data) => {
        if (!cancelled) setOrders(data.orders);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Wait for the session check before deciding. Redirecting during "checking"
  // would bounce a signed-in visitor to the login page on every hard refresh.
  if (!isReady) return <main className={`container ${styles.page}`} aria-busy="true" />;
  if (!user) return <Navigate to="/login" replace state={{ next: '/orders' }} />;

  return (
    <main className={`container ${styles.page}`}>
      <h1 className={styles.title}>{t.orders.title}</h1>

      {orders === null && <p className={styles.muted}>{t.account.working}</p>}

      {orders?.length === 0 && (
        <div className={styles.empty}>
          <p>{t.orders.empty}</p>
          <Button variant="primary" to="/products">
            {t.orders.browse}
          </Button>
        </div>
      )}

      <ul className={styles.list}>
        {orders?.map((order) => (
          <li key={order.id} className={styles.row}>
            <div className={styles.rowMain}>
              <span className={styles.orderNo}>
                {t.orders.orderNumber} <bdi dir="ltr">#{order.id.slice(-6)}</bdi>
              </span>
              <span className={styles.placed}>
                {t.orders.placed}{' '}
                <bdi dir="ltr">{new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-KW' : 'en-KW')}</bdi>
              </span>
            </div>

            <OrderStatus status={order.status} />

            <span className={styles.total}>{money(filsToDinar(order.totalFils))}</span>

            <Link to={`/orders/${order.id}`} className={styles.view}>
              {t.orders.view}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
