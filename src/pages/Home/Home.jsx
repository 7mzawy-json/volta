import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { getProduct, getByCategory, getPriceRange, getProductColors, categories } from '../../data/products.js';
import ProductCard from '../../components/ProductCard/ProductCard.jsx';
import ProductGlyph from '../../components/ProductGlyph/ProductGlyph.jsx';
import DeviceRender from '../../components/DeviceRender/DeviceRender.jsx';
import Button from '../../components/Button/Button.jsx';
import BoltMark from '../../components/BoltMark/BoltMark.jsx';
import Reveal from '../../components/Reveal/Reveal.jsx';
import { getColor } from '../../data/colors.js';
import { formatPrice } from '../../utils/currency.js';
import styles from './Home.module.css';

const categoryIcons = {
  phones: 'phone',
  chargers: 'chargepad',
  audio: 'earbuds',
  accessories: 'keyboard',
  smart: 'hub'
};

// The two phones the homepage argues for. Named rather than derived: a homepage
// is an editorial decision about what to lead with, not a query result.
const SPOTLIGHT_IDS = ['iphone-17-pro-max', 'galaxy-s26-ultra'];

function Spotlight({ product, flipped }) {
  const { lang, t } = useLanguage();
  if (!product) return null;

  const { min } = getPriceRange(product);
  const colorways = getProductColors(product);

  return (
    <section className={`${styles.spotlight} ${flipped ? styles.spotlightFlipped : ''}`}>
      <div className={`container ${styles.spotlightInner}`}>
        <Reveal className={styles.spotlightCopy}>
          <p className={styles.spotlightLabel}>{t.spotlight.label}</p>
          <h2 className={styles.spotlightTitle}>{product.name[lang]}</h2>
          <p className={styles.spotlightBody}>{product.description[lang]}</p>
          <p className={styles.spotlightPrice}>
            <span className={styles.fromLabel}>{t.product.from} </span>
            {formatPrice(min, lang)}
          </p>
          <div className={styles.spotlightActions}>
            <Button variant="primary" to={`/products/${product.id}`}>
              {t.spotlight.cta}
            </Button>
            <span className={styles.colorDots} aria-hidden="true">
              {colorways.slice(0, 4).map((c) => (
                <span key={c} className={styles.colorDot} style={{ background: getColor(c).hex }} />
              ))}
            </span>
          </div>
        </Reveal>

        <Reveal className={styles.spotlightVisual} delay={120}>
          <div className={styles.spotlightGlow} />
          <DeviceRender
            color={colorways[0]}
            brand={product.brand}
            wide={product.attributes?.screen >= 7.5}
            size={230}
          />
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const { lang, t } = useLanguage();
  const phones = getByCategory('phones');
  const featured = phones.slice(0, 4);
  const heroPhone = getProduct(SPOTLIGHT_IDS[0]);
  const spotlights = SPOTLIGHT_IDS.map(getProduct);

  return (
    <main className={styles.page}>
      {/* Hero — centred, one product, nothing competing with it. */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={`container ${styles.heroInner}`}>
          <Reveal>
            <p className={styles.eyebrow}>
              <BoltMark size={15} /> {t.hero.eyebrow}
            </p>
            <h1 className={styles.heroTitle}>{t.hero.title}</h1>
            <p className={styles.heroSubtitle}>{t.hero.subtitle}</p>
            <div className={styles.heroActions}>
              <Button variant="primary" to="/products?category=phones">
                {t.hero.cta}
              </Button>
              <Button variant="secondary" to="/products">
                {t.hero.secondaryCta}
              </Button>
            </div>
          </Reveal>

          <Reveal className={styles.heroVisual} delay={140}>
            {heroPhone && (
              <DeviceRender
                color={getProductColors(heroPhone)[0]}
                brand={heroPhone.brand}
                size={260}
              />
            )}
          </Reveal>
        </div>
      </section>

      {spotlights.map((product, i) => (
        <Spotlight key={product?.id || i} product={product} flipped={i % 2 === 1} />
      ))}

      {/* Bento — four claims, the largest tile carrying the strongest one. */}
      <section className={`container ${styles.section}`}>
        <Reveal>
          <h2 className={styles.sectionTitle}>{t.bento.title}</h2>
        </Reveal>
        <div className={styles.bento}>
          <Reveal className={`${styles.tile} ${styles.tileWide}`}>
            <h3 className={styles.tileTitle}>{t.bento.speed.title}</h3>
            <p className={styles.tileBody}>{t.bento.speed.body}</p>
            <p className={styles.tileStat}>75 KB</p>
          </Reveal>
          <Reveal className={styles.tile} delay={80}>
            <h3 className={styles.tileTitle}>{t.bento.arabic.title}</h3>
            <p className={styles.tileBody}>{t.bento.arabic.body}</p>
          </Reveal>
          <Reveal className={styles.tile} delay={120}>
            <h3 className={styles.tileTitle}>{t.bento.colors.title}</h3>
            <p className={styles.tileBody}>{t.bento.colors.body}</p>
          </Reveal>
          <Reveal className={`${styles.tile} ${styles.tileWide}`} delay={160}>
            <h3 className={styles.tileTitle}>{t.bento.warranty.title}</h3>
            <p className={styles.tileBody}>{t.bento.warranty.body}</p>
          </Reveal>
        </div>
      </section>

      <section className={`container ${styles.section}`}>
        <Reveal>
          <h2 className={styles.sectionTitle}>{t.categories.title}</h2>
        </Reveal>
        <Reveal>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link key={cat} to={`/products?category=${cat}`} className={styles.categoryTile}>
                <ProductGlyph icon={categoryIcons[cat]} size={34} />
                <span>{t.categories[cat]}</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className={`container ${styles.section}`}>
        <Reveal>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.featured.title}</h2>
            <Link to="/products?category=phones" className={styles.viewAll}>
              {t.featured.viewAll}
            </Link>
          </div>
        </Reveal>
        <Reveal>
          <div className={styles.productGrid}>
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      </section>

      <section className={styles.closing}>
        <div className={styles.closingGlow} />
        <Reveal className={`container ${styles.closingInner}`}>
          <h2 className={styles.closingTitle}>{t.closing.title}</h2>
          <p className={styles.closingSubtitle}>{t.closing.subtitle}</p>
          <Button variant="primary" to="/products?category=phones">
            {t.closing.cta}
          </Button>
        </Reveal>
      </section>
    </main>
  );
}
