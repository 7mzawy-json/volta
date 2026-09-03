import styles from './StickyBuyBar.module.css';

// A persistent buy bar for long product pages.
//
// Deliberately presentational: it takes `show` and renders. An earlier version
// took a ref and ran its own IntersectionObserver, which silently never fired —
// the observing component did not own the observed element, and debugging ref
// timing across a component boundary was not worth the coupling. The page owns
// the element, so the page decides.
//
// It does not appear while the real Add to Cart is on screen, so there are never
// two identical calls to action competing at once.
export default function StickyBuyBar({ show, children }) {
  return (
    <div
      className={`${styles.bar} ${show ? styles.barShown : ''}`}
      // Hidden from assistive tech while parked off screen: the real controls
      // above are canonical, and announcing a duplicate would be noise.
      aria-hidden={!show}
      inert={show ? undefined : ''}
    >
      <div className={`container ${styles.inner}`}>{children}</div>
    </div>
  );
}
