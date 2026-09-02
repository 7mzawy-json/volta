import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { findVariant } from '../data/products.js';
import { useToast } from './ToastContext.jsx';
import { useLanguage } from './LanguageContext.jsx';

const CartContext = createContext(null);

// Cart lines address a VARIANT, not a product, since the same phone in 128GB and
// 256GB are different prices and different stock. Carts saved before the variant
// migration stored { id, qty }; accessory variant ids match their product id, so
// those old lines can be carried over rather than silently dropped.
function readStoredCart() {
  try {
    const raw = localStorage.getItem('volta-cart');
    if (!raw) return [];
    return JSON.parse(raw)
      .map((line) => ({ variantId: line.variantId ?? line.id, qty: line.qty }))
      .filter((line) => line.variantId && findVariant(line.variantId));
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

  const addItem = (variantId, qty = 1) => {
    const found = findVariant(variantId);
    if (!found || found.variant.stock <= 0) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (!existing) return [...prev, { variantId, qty }];
      // Never let a line exceed what is actually on the shelf.
      const capped = Math.min(existing.qty + qty, found.variant.stock);
      return prev.map((i) => (i.variantId === variantId ? { ...i, qty: capped } : i));
    });

    showToast(t.misc.addedToast);
    setDrawerOpen(true);
  };

  const removeItem = (variantId) =>
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));

  const clearCart = () => setItems([]);

  const updateQty = (variantId, qty) => {
    if (qty <= 0) return removeItem(variantId);
    const found = findVariant(variantId);
    const capped = found ? Math.min(qty, found.variant.stock) : qty;
    setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, qty: capped } : i)));
  };

  const lineItems = useMemo(
    () =>
      items
        .map((line) => {
          const found = findVariant(line.variantId);
          return found ? { ...line, product: found.product, variant: found.variant } : null;
        })
        .filter(Boolean),
    [items]
  );

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => lineItems.reduce((sum, i) => sum + i.variant.price * i.qty, 0),
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

