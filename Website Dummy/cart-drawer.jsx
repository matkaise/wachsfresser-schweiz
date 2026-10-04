/* cart-drawer.jsx — Warenkorb als Schublade von rechts */

function CartDrawer({ open, onClose, items, onQty, onCheckout }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose}></div>
      <aside className={`cart-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="cart-head">
          <h3>Warenkorb</h3>
          <button className="cart-close" onClick={onClose}>Schliessen ×</button>
        </div>
        <div className="cart-items">
          {items.length === 0 && (
            <div className="cart-empty">Dein Warenkorb ist leer.<br/><a href="shop.html">Zum Shop</a></div>
          )}
          {items.map(it => (
            <div className="cart-item" key={it.id}>
              <img
                src={it.img}
                alt={it.name}
                style={{
                  objectPosition: it.crop === 'left' ? '0% 50%' : it.crop === 'right' ? '100% 50%' : '50% 50%',
                  transform: it.crop === 'center' ? 'scale(1.02)' : 'scale(1.4)',
                }}
              />
              <div>
                <h4>{it.name}</h4>
                <div className="muted" style={{ fontSize: 12 }}>{it.category} · {it.meta[0]}</div>
                <div className="qty">
                  <button onClick={() => onQty(it.id, -1)} aria-label="Weniger">−</button>
                  <span>{it.qty}</span>
                  <button onClick={() => onQty(it.id, +1)} aria-label="Mehr">+</button>
                </div>
              </div>
              <div className="price">CHF {(it.price * it.qty).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="cart-foot">
          <div className="cart-total">
            <span>Zwischensumme</span>
            <span>CHF {total.toFixed(2)}</span>
          </div>
          <button className="checkout-btn" disabled={items.length === 0} onClick={onCheckout}>
            Zur Kasse →
          </button>
        </div>
      </aside>
    </>
  );
}

window.CartDrawer = CartDrawer;
