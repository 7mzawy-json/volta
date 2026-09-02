import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { products } from '../data/products.js';
import { useToast } from './ToastContext.jsx';
import { useLanguage } from './LanguageContext.jsx';

const CartContext = createContext(null);

function readStoredCart() {
  try {
    const raw = localStorage.getItem('volta-cart');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    localStorage.setItem('volta-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (id, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) => (i.id === id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { id, qty }];
    });
    showToast(t.misc.addedToast);
    setDrawerOpen(true);
  };

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const clearCart = () => setItems([]);

  const updateQty = (id, qty) => {
    if (qty <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  };

  const lineItems = useMemo(
    () =>
      items
        .map((i) => {
          const product = products.find((p) => p.id === i.id);
          return product ? { ...i, product } : null;
        })
        .filter(Boolean),
    [items]
  );

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => lineItems.reduce((sum, i) => sum + i.product.price * i.qty, 0),
    [lineItems]
  );

  return (
    <CartContext.Provider
      value={{
        lineItems,
        count,
        subtotal,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        isDrawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false)
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
