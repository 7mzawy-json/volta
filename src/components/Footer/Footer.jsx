import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import BoltMark from '../BoltMark/BoltMark.jsx';
import styles from './Footer.module.css';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brandBlock}>
          <div className={styles.logo}>
            <BoltMark size={22} />
            <span>{t.brand}</span>
          </div>
          <p className={styles.tagline}>{t.tagline}</p>
        </div>

        <nav className={styles.links}>
          <Link to="/">{t.nav.home}</Link>
          <Link to="/products">{t.nav.products}</Link>
          <Link to="/wishlist">{t.nav.wishlist}</Link>
        </nav>

        <p className={styles.meta}>
          © {year} {t.brand} — {t.footer.rights}
          <br />
          {t.footer.demo}
        </p>
      </div>
    </footer>
  );
}
