/* sections.jsx — Wachsfresser sections */
const { useState, useEffect, useRef } = React;

/* === Reveal-on-scroll wrapper === */
function Reveal({ children, delay = 0, as: Tag = 'div', className = '', ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { setSeen(true); io.disconnect(); }
      });
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${seen ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* === NAV === */
function Nav({ cartCount, onCartOpen, links, brandHref = '#top' }) {
  const defaultLinks = [
    { href: 'shop.html', label: 'Shop' },
    { href: '#wachsfresser', label: 'Wachsfresser' },
    { href: '#about', label: 'Manufaktur' },
  ];
  const items = links || defaultLinks;
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <ul className="nav-links">
          {items.map(l => (
            <li key={l.label}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>
        <a href={brandHref} className="brand">
          <span className="brand-mark" aria-hidden="true"></span>
          <span>Wachsfresser</span>
        </a>
        <div className="nav-right">
          <button className="cart-btn" onClick={onCartOpen} aria-label="Warenkorb öffnen">
            <span>Warenkorb</span>
            <span className="cart-count">{cartCount}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

/* === HERO === */
function Hero({ variant = 'editorial' }) {
  const heroImg = variant === 'lifestyle'
    ? 'assets/product/eiger-dinner-scene.jpg'
    : 'assets/product/hero-outdoor-eiger.jpg';

  return (
    <header className="hero" data-hero={variant} id="top">
      <div className="container">
        <div className="hero-meta">
          <span>Wachsfresser · Schweiz</span>
          <span>Handgegossen in der Schweiz</span>
          <span>wachsfresser-schweiz.ch</span>
        </div>

        <div className="hero-grid">
          <div>
            <Reveal as="h1" className="hero-title">
              Wachsfresser<br/><em>aus Beton.</em>
            </Reveal>
            <Reveal delay={120}>
              <p className="hero-sub">
                Wiederbefüllbare Schmelzlichter aus handgegossenem Beton,
                vorbereitet mit Dauerdocht und Sojawachs-Startfüllung.
                Für Licht, das bleibt, wenn normales Wachs längst verbraucht wäre.
              </p>
              <a href="#shop" className="hero-cta">
                Kollektion entdecken
                <span className="arrow">→</span>
              </a>
            </Reveal>
          </div>

          <Reveal delay={220} className="hero-img-wrap">
            <img src={heroImg} alt="Handgegossene Wachsfresser aus Beton in Creme und Anthrazit" loading="eager" />
            <div className="hero-tag">
              <span className="lbl">Beton · Wachs · Weiterlicht</span>
              <span className="val">Eiger · Creme &amp; Anthrazit</span>
            </div>
          </Reveal>
        </div>
      </div>
    </header>
  );
}

/* === MARQUEE === */
function Strip() {
  const items = [
    'Handgegossen', 'Sojawachs-Startfüllung', 'Dauerdocht', 'Wiederbefüllbar',
    'Aus Salmsach', 'Wachs nachlegen', 'Creme & Anthrazit', 'Outdoor-Modell',
  ];
  const row = (
    <span>
      {items.map((t, i) => (
        <React.Fragment key={i}>
          {t}
          <span className="dot"></span>
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <div className="strip">
      <div className="strip-track">
        {row}{row}{row}
      </div>
    </div>
  );
}

/* === FEATURED (homepage preview) === */
function Featured({ onAdd, onOpen, shopHref = 'shop.html' }) {
  const featured = (window.PRODUCTS || []).slice(0, 4);
  return (
    <section className="shop" id="shop">
      <div className="container">
        <div className="section-head">
          <span className="idx">Nr. 02 — Auswahl</span>
          <h2 className="serif">Wachsfresser<br/>für neue Lichtmomente.</h2>
          <a href={shopHref} className="idx" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: 4 }}>
            Alle Stücke ansehen →
          </a>
        </div>
        <div className="shop-grid home-products">
          {featured.map(p => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* === ABOUT / WACHSFRESSER === */
function About() {
  return (
    <section className="about" id="wachsfresser">
      <div className="container">
        <div className="section-head" style={{ marginBottom: 'clamp(40px, 5vw, 80px)' }}>
          <span className="idx">Nr. 03 — Prinzip</span>
          <h2 className="serif">Was ein<br/>Wachsfresser kann.</h2>
          <span className="idx">Schmelzlicht</span>
        </div>

        <div className="about-grid">
          <div className="about-text">
            <Reveal as="h2">
              Ein Gefäss,<br/>das weiter <em>brennt.</em>
            </Reveal>
            <Reveal delay={80}>
              <p>
                Ein Wachsfresser ist kein Wegwerflicht. Das Betongefäss bleibt,
                der Docht bleibt, und neues Wachs kann nachgelegt werden. Geliefert
                wird jedes Stück einsatzbereit mit Docht und Sojawachs-Startfüllung.
              </p>
              <p>
                Die Gefässe entstehen in Salmsach von Hand. Produktionsbedingte
                Farbnuancen gehören dazu: Weiss/Creme wirkt hell und ruhig,
                Anthrazit schwerer und architektonischer.
              </p>
              <p>
                Die Eiger-Variante ist ausdrücklich für den Aussenbereich gedacht.
                Die Brenndauer wird noch getestet; bis dahin nennen wir keine
                geschätzten Stundenwerte.
              </p>
            </Reveal>

            <Reveal className="about-stats">
              <div className="stat">
                <div className="num">2</div>
                <div className="lbl">Formate</div>
              </div>
              <div className="stat">
                <div className="num">2</div>
                <div className="lbl">Farben</div>
              </div>
              <div className="stat">
                <div className="num">CHF</div>
                <div className="lbl">Schweizer Shop</div>
              </div>
              <div className="stat">
                <div className="num">CH</div>
                <div className="lbl">Salmsach, handgegossen</div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="about-mosaic">
            <div className="img tall">
              <img src="assets/product/eiger-creme.jpg" alt="Eiger Wachsfresser aus hellem Beton mit Holzdeckel" loading="lazy"/>
            </div>
            <div className="img short">
              <img src="assets/product/saentis-indoor-scene.jpg" alt="Säntis Wachsfresser in einer ruhigen Wohnszene" loading="lazy"/>
            </div>
            <div className="img short">
              <img src="assets/product/eiger-anthrazit.jpg" alt="Eiger Wachsfresser in Anthrazit mit Holzdeckel" loading="lazy"/>
            </div>
          </Reveal>
        </div>

        <div className="process" id="about">
          <Reveal className="step">
            <div className="n">01 — Giessen</div>
            <h4>Beton in Form bringen</h4>
            <p>Jedes Gefäss wird in Salmsach von Hand gegossen und nach dem Aushärten geprüft.</p>
          </Reveal>
          <Reveal className="step" delay={80}>
            <div className="n">02 — Vorbereiten</div>
            <h4>Docht einsetzen</h4>
            <p>Säntis kommt mit Glasfaserdocht, Eiger mit Holzfaserdocht für den Aussenbereich.</p>
          </Reveal>
          <Reveal className="step" delay={160}>
            <div className="n">03 — Füllen</div>
            <h4>Startwachs einlassen</h4>
            <p>Die Wachsfresser werden mit Sojawachs vorbereitet und sind direkt einsatzbereit.</p>
          </Reveal>
          <Reveal className="step" delay={240}>
            <div className="n">04 — Weiter nutzen</div>
            <h4>Wachs nachlegen</h4>
            <p>Geeignete Wachsreste können bis etwa 1 cm unter den Docht nachgefüllt werden.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* === FOOTER === */
function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            Wachsfresser<br/>aus <em>Beton.</em>
          </div>
          <div>
            <h5>Shop</h5>
            <ul>
              <li><a href="#shop">Säntis</a></li>
              <li><a href="#shop">Eiger</a></li>
              <li><a href="#wachsfresser">Was ist ein Wachsfresser?</a></li>
            </ul>
          </div>
          <div>
            <h5>Manufaktur</h5>
            <ul>
              <li><a href="#about">Über uns</a></li>
              <li><a href="#about">Prozess</a></li>
              <li><a href="#wachsfresser">Pflege</a></li>
            </ul>
          </div>
          <div>
            <h5>Kontakt</h5>
            <ul>
              <li><a href="mailto:hallo@wachsfresser-schweiz.ch">hallo@wachsfresser-schweiz.ch</a></li>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Newsletter</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Wachsfresser · Salmsach, Schweiz</span>
          <span>Impressum · Datenschutz · AGB</span>
        </div>
      </div>
    </footer>
  );
}

/* === CART DRAWER === */
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
            <div className="cart-empty">Noch leer.<br/>Such dir einen Wachsfresser aus.</div>
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

Object.assign(window, { Nav, Hero, Strip, Featured, About, Footer, CartDrawer, Reveal });
