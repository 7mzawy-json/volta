import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import BoltMark from '../../components/BoltMark/BoltMark.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './Confirmation.module.css';

export default function Confirmation() {
  const { t } = useLanguage();
  const location = useLocation();
  const orderId = location.state?.orderId ?? Math.floor(1000 + Math.random() * 9000);

  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.boltWrap}>
        <BoltMark size={64} glow />
      </div>
      <h1>{t.confirmation.title}</h1>
      <p className={styles.message}>
        {t.confirmation.message} <span className={styles.orderId}>#{orderId}</span> {t.confirmation.onTheWay}
      </p>
      <Button variant="primary" to="/products">
        {t.confirmation.continue}
      </Button>
    </main>
  );
}
