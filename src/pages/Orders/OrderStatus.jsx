import { useLanguage } from '../../context/LanguageContext.jsx';
import styles from './Orders.module.css';

// Status as a labelled pill. Colour alone would carry the meaning for sighted
// readers only, so the word is always present and the colour merely reinforces
// it — the same reason the compare table marks its best value in text too.
const TONE = { pending: styles.pending, paid: styles.paid, failed: styles.failed };

export default function OrderStatus({ status }) {
  const { t } = useLanguage();
  const label = {
    pending: t.orders.statusPending,
    paid: t.orders.statusPaid,
    failed: t.orders.statusFailed
  }[status];

  return <span className={`${styles.status} ${TONE[status] || ''}`}>{label}</span>;
}
