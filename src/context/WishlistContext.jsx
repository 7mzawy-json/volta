import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext.jsx';
import { useLanguage } from './LanguageContext.jsx';

const WishlistContext = createContext(null);

function readStoredWishlist() {
  try {
    const raw = localStorage.getItem('volta-wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(readStoredWishlist);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    localStorage.setItem('volta-wishlist', JSON.stringify(ids));
  }, [ids]);

  const toggle = (id) => {
    // Toast fires outside the updater: state updaters must stay pure, and
    // StrictMode double-invokes them in development.
    if (!ids.includes(id)) showToast(t.misc.favoritedToast);
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isFavorited = (id) => ids.includes(id);

  return (
    <WishlistContext.Provider value={{ ids, toggle, isFavorited, count: ids.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
