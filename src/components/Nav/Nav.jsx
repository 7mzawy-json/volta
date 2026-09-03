import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import BoltMark from '../BoltMark/BoltMark.jsx';
import styles from './Nav.module.css';

export default function Nav() {
  const { lang, toggleLang, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { count, openDrawer } = useCart();
  const { count: wishCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpenPhone, setSearchOpenPhone] = useState(false);
  const [query, setQuery] = useState(location.pathname === '/products' ? searchParams.get('q') || '' : '');

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/products') {
      setQuery('');
    }
  }, [location.pathname]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    navigate(`/products?q=${encodeURIComponent(value)}`, { replace: true });
  };

  const linkClass = ({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <button
          type="button"
          className={styles.hamburger}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t.nav.menu}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <NavLink to="/" className={styles.logo}>
          <BoltMark size={26} glow />
          <span>{t.brand}</span>
        </NavLink>

        <nav className={styles.links} aria-label={t.nav.menu}>
          <NavLink to="/" className={linkClass} end>
            {t.nav.home}
          </NavLink>
          <NavLink to="/products" className={linkClass}>
            {t.nav.products}
          </NavLink>
        </nav>

        <div className={`${styles.searchWrap} ${searchOpenPhone ? styles.searchOpen : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={handleSearchChange}
            placeholder={t.nav.searchPlaceholder}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtnPhoneOnly}
            aria-label={t.nav.searchPlaceholder}
            onClick={() => setSearchOpenPhone((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>

          <button
            type="button"
            className={styles.iconBtn}
            onClick={toggleTheme}
            aria-label={isDark ? t.misc.themeToLight : t.misc.themeToDark}
            title={isDark ? t.misc.themeToLight : t.misc.themeToDark}
          >
            {isDark ? (
              /* In dark mode, offer the sun. */
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2.6v2.2M12 19.2v2.2M4.3 4.3l1.6 1.6M18.1 18.1l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.3 19.7l1.6-1.6M18.1 5.9l1.6-1.6" />
              </svg>
            ) : (
              /* In light mode, offer the moon. */
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="M20.5 14.2A8.4 8.4 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
              </svg>
            )}
          </button>

          <button type="button" className={styles.langBtn} onClick={toggleLang}>
            {t.nav.langSwitch}
          </button>

          <NavLink to="/wishlist" className={styles.iconBtn} aria-label={t.nav.wishlist}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7.5-4.9-10-9.3C.5 8.2 2.2 4.5 6 4.5c2.1 0 3.7 1.2 4.5 2.7C11.3 5.7 12.9 4.5 15 4.5c3.8 0 5.5 3.7 4 7.2C19.5 16.1 12 21 12 21z" />
            </svg>
            {wishCount > 0 && <span className={styles.badge}>{wishCount}</span>}
          </NavLink>

          <button type="button" className={styles.iconBtn} aria-label={t.nav.cart} onClick={openDrawer}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h2l2.4 12.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L21 8H7" />
              <circle cx="10" cy="21" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="18" cy="21" r="1.4" fill="currentColor" stroke="none" />
            </svg>
            {count > 0 && <span className={`${styles.badge} ${styles.badgePop}`} key={count}>{count}</span>}
          </button>
        </div>
      </div>

      <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}>
        <nav className={styles.drawerLinks}>
          <NavLink to="/" className={linkClass} end onClick={() => setMenuOpen(false)}>
            {t.nav.home}
          </NavLink>
          <NavLink to="/products" className={linkClass} onClick={() => setMenuOpen(false)}>
            {t.nav.products}
          </NavLink>
          <NavLink to="/wishlist" className={linkClass} onClick={() => setMenuOpen(false)}>
            {t.nav.wishlist}
          </NavLink>
        </nav>
      </div>
      {menuOpen && <button className={styles.scrim} aria-hidden="true" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
