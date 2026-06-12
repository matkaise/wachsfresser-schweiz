/* cart-store.jsx — shared cart state across pages */
const { useState: useStateCart, useEffect: useEffectCart } = React;

const CART_KEY = 'wf_cart';

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function writeCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
}

function useCart() {
  const [items, setItems] = useStateCart(() => readCart());

  useEffectCart(() => { writeCart(items); }, [items]);

  // Cross-tab sync
  useEffectCart(() => {
    const onStorage = (e) => { if (e.key === CART_KEY) setItems(readCart()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = (product) => {
    setItems(prev => {
      const found = prev.find(i => i.id === product.id);
      if (found) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };
  const setQty = (id, delta) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  };
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, add, setQty, clear, count };
}

window.useCart = useCart;
