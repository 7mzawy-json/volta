import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getProduct } from '../data/products.js';

const CompareContext = createContext(null);

// Four is the ceiling on purpose. A comparison table's whole value is that you
// can read a row across at a glance; past four columns it stops being a
// comparison and becomes a spreadsheet, and on a phone it would be unreadable
// well before that.
export const MAX_COMPARE = 4;

// Comparison is a BROWSING feature, so it only exists on routes whose job is
// showing a set you might choose between.
//
// It used to appear everywhere. That put the tray on the product page fighting
// the sticky buy bar for the bottom of the screen (and winning, at z-index 45
// against 40, so it covered the primary CTA), and left it sitting over the
// checkout form where comparing phones is not the task any more.
//
// The control and its feedback travel together: where the tray is hidden the
// compare checkbox is hidden too, because a tick-box that produces no visible
// result is worse than no tick-box.
const COMPARE_SURFACES = ['/', '/products', '/wishlist'];

function readStored() {
  try {
    const raw = localStorage.getItem('volta-compare');
    if (!raw) return [];
    // Drop ids that no longer resolve, so a stale entry cannot render an empty
    // column or crash the table.
    return JSON.parse(raw).filter((id) => getProduct(id)).slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }) {
  const [ids, setIds] = useState(readStored);
  const { pathname } = useLocation();
  // Exact match only: "/products" is a listing, "/products/iphone-15" is not.
  const canCompare = COMPARE_SURFACES.includes(pathname);

  useEffect(() => {
    try {
      localStorage.setItem('volta-compare', JSON.stringify(ids));
    } catch {
      /* private mode — comparison still works for this session */
    }
  }, [ids]);

  const toggle = (id) =>
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });

  const remove = (id) => setIds((prev) => prev.filter((x) => x !== id));
  const clear = () => setIds([]);

  const products = useMemo(() => ids.map(getProduct).filter(Boolean), [ids]);

  return (
    <CompareContext.Provider
      value={{
        ids,
        products,
        toggle,
        remove,
        clear,
        count: ids.length,
        canCompare,
        isComparing: (id) => ids.includes(id),
        isFull: ids.length >= MAX_COMPARE
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
