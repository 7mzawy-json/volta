import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { products, categories } from '../../data/products.js';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import ProductGlyph from '../../components/ProductGlyph/ProductGlyph.jsx';
import Button from '../../components/Button/Button.jsx';
import BoltMark from '../../components/BoltMark/BoltMark.jsx';
import styles from './Home.module.css';

const categoryIcons = {
  chargers: 'chargepad',
  audio: 'earbuds',
  accessories: 'keyboard',
  smart: 'hub'
};

export default function Home() {
  const { lang, t } = useLanguage();
  const featured = products.slice(0, 4);

  return (
    <main>
      <section className={`container ${styles.hero}`}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>
            <BoltMark size={16} /> {t.hero.eyebrow}
          </span>
          <h1 className={styles.title}>{t.hero.title}</h1>
          <p className={styles.subtitle}>{t.hero.subtitle}</p>
          <div className={styles.ctaRow}>
            <Button variant="primary" to="/products">
              {t.hero.cta}
            </Button>
            <Button variant="secondary" to="/products">
              {t.hero.secondaryCta}
            </Button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.glowCircle} />
          <ProductGlyph icon="earbuds" size={160} />
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <h2 className={styles.sectionTitle}>{t.categories.title}</h2>
        <div className={styles.categoryGrid}>
          {categories.map((cat) => (
            <Link key={cat} to={`/products?category=${cat}`} className={styles.categoryTile}>
              <ProductGlyph icon={categoryIcons[cat]} size={36} />
              <span>{t.categories[cat]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{t.featured.title}</h2>
          <Link to="/products" className={styles.viewAll}>
            {t.featured.viewAll}
          </Link>
        </div>
        <div className={styles.productGrid}>
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <h2 className={styles.sectionTitle}>{t.trust.title}</h2>
        <div className={styles.trustGrid}>
          {t.trust.items.map((item, i) => (
            <div key={i} className={styles.trustCard}>
              <span className={styles.trustNumber}>0{i + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
