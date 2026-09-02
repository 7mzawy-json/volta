import { useEffect, useRef, useState } from 'react';
import styles from './Reveal.module.css';

// Reveals its children once, when they first scroll into view.
//
// IntersectionObserver rather than a scroll listener: the browser does the work
// off the main thread, and each element stops being watched the moment it has
// appeared, so a long page does not accumulate handlers.
//
// Anyone who has asked their system for reduced motion gets the content
// immediately, with no transition and no observer at all.

const REDUCED = '(prefers-reduced-motion: reduce)';

export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(REDUCED).matches
  );

  useEffect(() => {
    if (shown) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // Fire slightly before the element reaches the fold, so it has finished
      // arriving by the time it is properly in view.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${shown ? styles.shown : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
