/* shop-components.jsx — Shop grid, product card, detail drawer */
const { useState, useEffect, useRef, useMemo } = React;

function formatPrice(value) {
  return `CHF ${Number(value).toFixed(2)}`;
}

/* === Product Card (used in shop grid) === */
function ProductCard({ product, onAdd, onOpen, href }) {
  const [added, setAdded] = useState(false);
  const handleAdd = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };
  const handleClick = (e) => {
    if (onOpen) {
      e.preventDefault();
      onOpen(product);
    }
  };

  const objectPos = product.crop === 'left' ? '0% 50%'
                  : product.crop === 'right' ? '100% 50%' : '50% 50%';
  const scale = product.crop === 'center' ? 'scale(1.02)' : 'scale(1.4)';

  const linkHref = href || `product.html?id=${product.id}`;

  return (
    <Reveal className="product">
      <a href={linkHref} onClick={handleClick} style={{ display: 'block' }}>
        <div className="product-media">
          <img
            src={product.img}
            alt={product.name}
            style={{ objectPosition: objectPos, transform: scale }}
            loading="lazy"
          />
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <div className="product-quick">
            <span className="label">Schnell hinzufügen</span>
            <button
              className={`add-btn ${added ? 'added' : ''}`}
              onClick={handleAdd}
              aria-label={`${product.name} in den Warenkorb`}
            >
              {added ? '✓ Hinzugefügt' : '+ Hinzufügen'}
            </button>
          </div>
        </div>
        <div className="product-info">
          <div>
            <h3>{product.name}</h3>
            <p className="desc">{product.desc}</p>
            <div className="product-meta">
              {product.meta.slice(0, 2).map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
          <div className="price">{formatPrice(product.price)}</div>
        </div>
      </a>
    </Reveal>
  );
}

/* === Shop Grid Page === */
function ShopGrid({ onAdd, onOpen }) {
  const [cat, setCat] = useState('Alle');
  const [sort, setSort] = useState('default');

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.replace('#', ''));
    if (hash && CATEGORIES.includes(hash)) setCat(hash);
  }, []);

  const filtered = useMemo(() => {
    let list = cat === 'Alle' ? PRODUCTS : PRODUCTS.filter(p => p.category === cat);
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [cat, sort]);

  return (
    <section className="shop-page">
      <div className="container">
        <div className="shop-hero">
          <span className="idx">Nr. 01 — Kollektion</span>
          <h1>Wachsfresser<br/><em>aus Beton.</em></h1>
          <span className="idx">{filtered.length} Stück</span>
        </div>

        <div className="shop-toolbar">
          <div className="filter-pills">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`pill ${cat === c ? 'active' : ''}`}
                onClick={() => setCat(c)}
              >{c}</button>
            ))}
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="default">Sortierung — Standard</option>
            <option value="price-asc">Preis aufsteigend</option>
            <option value="price-desc">Preis absteigend</option>
          </select>
        </div>

        <div className="shop-grid">
          {filtered.length === 0 && (
            <div className="shop-empty">Keine Stücke in dieser Kategorie.</div>
          )}
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} onOpen={onOpen} />
          ))}
        </div>

        <div className="shop-note">
          <p>
            Alle Wachsfresser werden in Salmsach von Hand aus Beton gegossen und
            einsatzbereit mit Docht und Sojawachs-Startfüllung geliefert. Säntis
            ist die kompakte Linie, Eiger die Variante für den Aussenbereich.
            Der Versand in der Schweiz dauert in der Regel rund 3 Werktage;
            Europa ist auf Anfrage bzw. im Shop grundsätzlich möglich.
          </p>
        </div>
      </div>
    </section>
  );
}

/* === Product Detail Drawer === */
function ProductDetail({ product, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setQty(1);
      setAdded(false);
    }
  }, [product?.id]);

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const open = !!product;
  const objectPos = product?.crop === 'left' ? '0% 50%'
                  : product?.crop === 'right' ? '100% 50%' : '50% 50%';

  return (
    <>
      <div className={`detail-overlay ${open ? 'open' : ''}`} onClick={onClose}></div>
      <aside className={`detail ${open ? 'open' : ''}`} aria-hidden={!open}>
        {product && (
          <>
            <button className="detail-close" onClick={onClose}>Schliessen ×</button>
            <div className="detail-grid" style={{ marginTop: -50 }}>
              <div className="detail-media">
                <img
                  src={product.img}
                  alt={product.name}
                  style={{ objectPosition: objectPos }}
                />
              </div>
              <div className="detail-content">
                <span className="cat">{product.category} · Wachsfresser</span>
                <h2>{product.name}</h2>
                <div className="price-row">
                  <span className="price">{formatPrice(product.price)}</span>
                  <span className="stock">Auf Lager</span>
                </div>
                <p>{product.long}</p>

                <div className="detail-specs">
                  {product.meta.map((m, i) => {
                    const labels = ['Docht', 'Hinweis', 'Nutzung', 'Detail'];
                    return (
                      <div className="spec" key={i}>
                        <span className="k">{labels[i] || 'Detail'}</span>
                        <span className="v">{m}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="detail-actions">
                  <div className="qty-stepper">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Weniger">−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(qty + 1)} aria-label="Mehr">+</button>
                  </div>
                  <button className="add-big" onClick={handleAdd}>
                    {added ? '✓ Hinzugefügt' : `In den Warenkorb · ${formatPrice(product.price * qty)}`}
                  </button>
                </div>

                <a
                  href={`product.html?id=${product.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-soft)',
                    paddingTop: 8,
                  }}
                >
                  Vollständige Produktseite öffnen →
                </a>

                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--ink-soft)' }}>
                  <div>Versand in der Schweiz ca. 3 Werktage · Europaweit möglich</div>
                  <div>Handgegossen in Salmsach · Wachs bis ca. 1 cm unter den Docht nachfüllen</div>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

Object.assign(window, { ProductCard, ShopGrid, ProductDetail });
