import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMoney } from '../../context/CurrencyContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { api } from '../../api/client.js';
import OrderStatus from './OrderStatus.jsx';
import { filsToDinar } from './fils.js';
import styles from './Orders.module.css';

// Where a shopper lands after paying — and where the bonus challenge lives.
//
// Stripe sends the browser here the instant the card is accepted, but the ORDER
// is not paid until Stripe's webhook reaches the server, which happens
// separately and usually a moment later. So this page routinely opens on a
// pending order and has to become "paid" on its own.
//
// It polls rather than holding a socket open. That is a deliberate trade: the
// API is on Render's free tier behind Vercel's proxy, and neither a WebSocket
// nor an SSE stream survives that arrangement reliably, whereas a two-second
// fetch does. It stops the moment the status settles, so it is a handful of
// requests, not a permanent drip.

const POLL_MS = 2000;
const GIVE_UP_AFTER_MS = 2 * 60 * 1000;

export default function OrderDetail() {
  const { id } = useParams();
  const { lang, t } = useLanguage();
  const { user, isReady } = useAuth();
  const money = useMoney();
  // `clear` — which this used to destructure — does not exist on the cart
  // context. Calling it threw inside the poll's try/catch every time an order
  // came back paid, so the basket was never emptied and the failed attempt
  // silently cost an extra poll. An audit found it; nothing failed loudly.
  const { removeItems } = useCart();
  const [searchParams] = useSearchParams();
  // Only a return from Stripe empties anything. Opening an old paid order with
  // a new basket must leave that basket alone.
  const cameFromCheckout = searchParams.get('checkout') === 'success';

  const [order, setOrder] = useState(null);
  const [missing, setMissing] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  // Whether this page WATCHED the payment land, as opposed to opening on an
  // order that was already paid. Only the former deserves a thank-you.
  const [justPaid, setJustPaid] = useState(false);
  const cartCleared = useRef(false);

  useEffect(() => {
    if (!user) return undefined;

    let cancelled = false;
    let timer = null;
    const startedAt = Date.now();

    async function poll() {
      try {
        const { order: fresh } = await api.get(`/orders/${id}`);
        if (cancelled) return;

        setOrder((previous) => {
          if (previous?.status === 'pending' && fresh.status === 'paid') setJustPaid(true);
          return fresh;
        });

        // The basket empties only once payment is confirmed. Clearing it when
        // the session was created would punish anyone who backed out of Stripe.
        //
        // And only the lines that were actually bought, on the visit that
        // bought them: this page is also how someone reads an order from last
        // month, and that must not empty today's shopping.
        if (fresh.status === 'paid' && !cartCleared.current && cameFromCheckout) {
          cartCleared.current = true;
          removeItems(fresh.lines.map((l) => l.variantId));
        }

        if (fresh.status !== 'pending') return; // settled: stop polling
        if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
          setGaveUp(true);
          return;
        }
        timer = setTimeout(poll, POLL_MS);
      } catch (err) {
        if (cancelled) return;
        // A 404 here means "not yours" as much as "no such order" — the API
        // deliberately does not distinguish them.
        if (err.status === 404) setMissing(true);
        else timer = setTimeout(poll, POLL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, user, removeItems, cameFromCheckout]);

  if (!isReady) return <main className={`container ${styles.page}`} aria-busy="true" />;
  if (!user) return <Navigate to="/login" replace state={{ next: `/orders/${id}` }} />;

  if (missing) {
    return (
      <main className={`container ${styles.page}`}>
        <h1 className={styles.title}>{t.orders.notFound}</h1>
        <Link to="/orders" className={styles.view}>
          {t.orders.back}
        </Link>
      </main>
    );
  }

  if (!order) return <main className={`container ${styles.page}`} aria-busy="true" />;

  const waiting = order.status === 'pending' && !gaveUp;

  return (
    <main className={`container ${styles.page}`}>
      <Link to="/orders" className={styles.back}>
        {t.orders.back}
      </Link>

      <div className={styles.head}>
        <h1 className={styles.title}>
          {t.orders.orderNumber} <bdi dir="ltr">#{order.id.slice(-6)}</bdi>
        </h1>
        <OrderStatus status={order.status} />
      </div>

      {/* aria-live so the change is ANNOUNCED, not just repainted. Without it
          the bonus works for people watching the screen and for nobody else. */}
      <div className={styles.liveRegion} aria-live="polite">
        {waiting && (
          <p className={styles.waiting}>
            <span className={styles.spinner} aria-hidden="true" />
            {t.orders.waiting} <span className={styles.waitingNote}>{t.orders.waitingNote}</span>
          </p>
        )}
        {justPaid && <p className={styles.paidBanner}>{t.orders.justPaid}</p>}
      </div>

      <ul className={styles.lines}>
        {order.lines.map((line) => (
          <li key={line.variantId} className={styles.line}>
            <span className={styles.lineName}>
              <bdi>{line.name}</bdi>
              <span className={styles.lineQty}>× {line.qty}</span>
            </span>
            <span className={styles.linePrice}>{money(filsToDinar(line.unitFils * line.qty))}</span>
          </li>
        ))}
      </ul>

      <p className={styles.grandTotal}>
        <span>{t.orders.total}</span>
        <strong>{money(filsToDinar(order.totalFils))}</strong>
      </p>

      <p className={styles.placedLine}>
        {t.orders.placed}{' '}
        <bdi dir="ltr">
          {new Date(order.createdAt).toLocaleString(lang === 'ar' ? 'ar-KW' : 'en-KW')}
        </bdi>
      </p>
    </main>
  );
}
