import { useLanguage } from '../../context/LanguageContext.jsx';
import BoltMark from '../../components/BoltMark/BoltMark.jsx';
import Button from '../../components/Button/Button.jsx';
import styles from './NotFound.module.css';

// Without a wildcard route an unknown URL rendered the shared shell around an
// empty page — nav and footer, nothing between them, and no way to tell whether
// the site was broken or the address was wrong.
export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <BoltMark size={52} glow />
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>{t.notFound.title}</h1>
      <p className={styles.message}>{t.notFound.message}</p>
      <div className={styles.actions}>
        <Button variant="primary" to="/products?category=phones">
          {t.notFound.browse}
        </Button>
        <Button variant="secondary" to="/">
          {t.notFound.home}
        </Button>
      </div>
    </main>
  );
}
