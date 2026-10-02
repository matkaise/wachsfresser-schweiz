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
  const progressRef = useRef(null);
  useEffect(() => window.WFMotion ? WFMotion.progressBar(progressRef.current) : undefined, []);
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
      <span className="nav-progress" ref={progressRef} aria-hidden="true"></span>
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

/* === HERO 3D — Three.js-Bühne mit Konfigurator === */
const HERO_MODELS = [
  { key: 'saentis', label: 'Säntis', sub: 'Kompakt' },
  { key: 'eiger', label: 'Eiger', sub: 'Outdoor' },
];
const HERO_COLORS = [
  { key: 'creme', label: 'Creme', swatch: '#E8E1D2' },
  { key: 'anthrazit', label: 'Anthrazit', swatch: '#5C5A56' },
];

function productForSelection(sel) {
  const prefix = sel.model === 'eiger' ? 'eiger-gross' : 'saentis-klein';
  const list = window.PRODUCTS || [];
  return list.find(p => p.id === `${prefix}-${sel.color}`) || list[0];
}

const formatChf = (v) => `CHF ${Number(v).toFixed(2)}`;

function TrustIcon({ name }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'flame') return (<svg {...common}><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.4 1.3-3.9 2.5-5 .2 1.6.9 2.6 2 3 0-3 0-5.5.5-8Z"/></svg>);
  if (name === 'hand') return (<svg {...common}><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><circle cx="12" cy="13.5" r="2.5"/></svg>);
  if (name === 'truck') return (<svg {...common}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>);
  return (<svg {...common}><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></svg>);
}

function Hero3D({ selection, onSelect, onAdd }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const ctrlRef = useRef(null);
  const priceRef = useRef(null);
  const thumbRef = useRef(null);
  const prevPrice = useRef(null);
  const [ready, setReady] = useState(false);
  const [added, setAdded] = useState(false);
  const product = productForSelection(selection);
  const modelIndex = Math.max(0, HERO_MODELS.findIndex(m => m.key === selection.model));
  const colorLabel = (HERO_COLORS.find(c => c.key === selection.color) || HERO_COLORS[0]).label;

  // Three.js-Szene einhängen, sobald das Modul geladen ist
  useEffect(() => {
    let cancelled = false;
    const init = () => {
      if (cancelled || ctrlRef.current || !window.WFHeroScene || !canvasRef.current) return;
      const ctrl = window.WFHeroScene.create(canvasRef.current, selection);
      if (!ctrl) return;
      ctrlRef.current = ctrl;
      ctrl.intro();
      setReady(true);
    };
    if (window.WFHeroScene) init();
    else window.addEventListener('wf:scene-ready', init);
    return () => {
      cancelled = true;
      window.removeEventListener('wf:scene-ready', init);
      if (ctrlRef.current) ctrlRef.current.destroy();
      ctrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ctrlRef.current) ctrlRef.current.setVariant(selection);
  }, [selection.model, selection.color]);

  // Preis zählt weich zum neuen Wert
  useEffect(() => {
    const el = priceRef.current;
    if (!el || !product) return;
    if (prevPrice.current === null || !window.WFMotion) el.textContent = formatChf(product.price);
    else WFMotion.animateNumber(el, prevPrice.current, product.price, formatChf);
    prevPrice.current = product.price;
  }, [product && product.price]);

  // Intro-Choreografie und Scroll-Kopplung
  useEffect(() => {
    if (!window.WFMotion) return undefined;
    return WFMotion.scope(rootRef.current, () => {
      const { gsap, ScrollTrigger } = WFMotion;
      gsap.from('.hero3d-title .w', { yPercent: 115, rotate: 3, duration: 1.3, stagger: 0.09, ease: 'expo.out', delay: 0.15 });
      gsap.from('.hero3d-fade', { y: 26, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', delay: 0.55 });
      gsap.from('.hero3d-config', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.95 });
      gsap.from('.hero3d-trust .trust-item', { y: 20, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 1.1 });
      if (ScrollTrigger) {
        ScrollTrigger.create({
          trigger: stageRef.current,
          start: 'top top',
          end: 'bottom top',
          onUpdate: (self) => { if (ctrlRef.current) ctrlRef.current.setScroll(self.progress); },
        });
        gsap.to('.hero3d-content', {
          yPercent: -14, opacity: 0.15, ease: 'none',
          scrollTrigger: { trigger: stageRef.current, start: 'top top', end: 'bottom top', scrub: true },
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!window.WFMotion) return undefined;
    const cleanups = [...rootRef.current.querySelectorAll('[data-magnetic]')].map(el => WFMotion.magnetic(el, 0.25));
    return () => cleanups.forEach(c => c());
  }, []);

  const handleAdd = () => {
    if (!product) return;
    onAdd(product, thumbRef.current);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <header className="hero3d" id="top" ref={rootRef}>
      <div className="container">
        <div className={`hero3d-stage ${ready ? 'is-live' : ''}`} ref={stageRef}>
          <div className="hero3d-poster" aria-hidden="true">
            <img src="assets/product/hero-outdoor-eiger.jpg" alt="" loading="eager"/>
          </div>
          <div className="hero3d-canvas" ref={canvasRef}></div>
          <div className="hero3d-vignette" aria-hidden="true"></div>

          <div className="hero3d-content">
            <div className="hero3d-eyebrow hero3d-fade">
              <span className="live-dot" aria-hidden="true"></span>
              Handgegossen in Salmsach · Schweiz
            </div>
            <h1 className="hero3d-title">
              <span className="line"><span className="w">Wachsfresser</span></span>
              <span className="line"><em className="w">aus</em> <em className="w">Beton.</em></span>
            </h1>
            <p className="hero3d-sub hero3d-fade">
              Das Gefäss bleibt, der Docht bleibt. Du legst Wachs nach,
              und das Licht kommt zurück. Geliefert einsatzbereit mit
              Sojawachs-Startfüllung.
            </p>
            <div className="hero3d-ctas hero3d-fade">
              <a href="#shop" className="btn-glow" data-magnetic>
                Kollektion entdecken
                <span className="arrow">→</span>
              </a>
              <a href="#wachsfresser" className="btn-ghost">So funktioniert’s</a>
            </div>
          </div>

          <div className="hero3d-config" aria-label="Wachsfresser konfigurieren">
            <div className="cfg-row">
              <div className="cfg-field">
                <span className="cfg-label">Modell</span>
                <div className="cfg-seg" role="radiogroup" aria-label="Modell" style={{ '--i': modelIndex }}>
                  <span className="cfg-seg-thumb" aria-hidden="true"></span>
                  {HERO_MODELS.map(m => (
                    <button
                      key={m.key}
                      type="button"
                      role="radio"
                      aria-checked={selection.model === m.key}
                      className={selection.model === m.key ? 'active' : ''}
                      onClick={() => onSelect({ ...selection, model: m.key })}
                    >
                      {m.label}<small>{m.sub}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="cfg-field">
                <span className="cfg-label">Farbe · {colorLabel}</span>
                <div className="cfg-swatches" role="radiogroup" aria-label="Farbe">
                  {HERO_COLORS.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      role="radio"
                      aria-checked={selection.color === c.key}
                      aria-label={c.label}
                      className={`cfg-swatch ${selection.color === c.key ? 'active' : ''}`}
                      style={{ '--sw': c.swatch }}
                      onClick={() => onSelect({ ...selection, color: c.key })}
                    ></button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cfg-buy">
              <img ref={thumbRef} className="cfg-thumb" src={product && product.img} alt=""/>
              <div className="cfg-price-wrap">
                <span className="cfg-name">{product && product.name}</span>
                <span className="cfg-price" ref={priceRef}></span>
              </div>
              <button type="button" className={`cfg-add ${added ? 'added' : ''}`} onClick={handleAdd} data-magnetic>
                {added ? '✓ Im Warenkorb' : 'In den Warenkorb'}
              </button>
            </div>
            <div className="cfg-foot">
              <span>
                {selection.model === 'eiger'
                  ? 'Holzfaserdocht · Holzdeckel · nur Aussenbereich'
                  : 'Glasfaserdocht · Sojawachs-Startfüllung · wiederbefüllbar'}
              </span>
              {product && <a href={`product.html?id=${product.id}`}>Details →</a>}
            </div>
          </div>

          <div className="hero3d-scroll" aria-hidden="true">
            <span>Scroll</span>
            <span className="bar"></span>
          </div>
        </div>

        <div className="hero3d-trust">
          <div className="trust-item"><TrustIcon name="flame"/><div><strong>Einsatzbereit</strong><span>mit Docht &amp; Sojawachs-Startfüllung</span></div></div>
          <div className="trust-item"><TrustIcon name="hand"/><div><strong>Handgegossen</strong><span>in Salmsach, Thurgau</span></div></div>
          <div className="trust-item"><TrustIcon name="truck"/><div><strong>Versand Schweiz</strong><span>in der Regel ca. 3 Werktage</span></div></div>
          <div className="trust-item"><TrustIcon name="refill"/><div><strong>Wiederbefüllbar</strong><span>Wachsreste einfach nachlegen</span></div></div>
        </div>
      </div>
    </header>
  );
}

/* === Sticky-Kaufleiste nach dem Hero === */
function StickyBuyBar({ selection, onAdd, hidden }) {
  const [inView, setInView] = useState({ hero: true, cta: false, footer: false });
  const thumbRef = useRef(null);
  const product = productForSelection(selection);

  useEffect(() => {
    const targets = [['hero', '#top'], ['cta', '#kaufen'], ['footer', '.footer']]
      .map(([k, sel]) => [k, document.querySelector(sel)])
      .filter(([, el]) => el);
    const io = new IntersectionObserver((entries) => {
      setInView(prev => {
        const next = { ...prev };
        entries.forEach(e => {
          const hit = targets.find(([, el]) => el === e.target);
          if (hit) next[hit[0]] = e.isIntersecting;
        });
        return next;
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    targets.forEach(([, el]) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const show = !hidden && !inView.hero && !inView.cta && !inView.footer;
  if (!product) return null;

  return (
    <div className={`buybar ${show ? 'show' : ''}`} aria-hidden={!show}>
      <img ref={thumbRef} src={product.img} alt=""/>
      <div className="buybar-text">
        <strong>{product.name}</strong>
        <span>Einsatzbereit · handgegossen in Salmsach</span>
      </div>
      <span className="buybar-price">{formatChf(product.price)}</span>
      <button
        type="button"
        className="buybar-btn"
        tabIndex={show ? 0 : -1}
        onClick={() => onAdd(product, thumbRef.current)}
      >
        In den Warenkorb
      </button>
    </div>
  );
}

/* === Abschluss-CTA === */
function CtaBand() {
  const ref = useRef(null);
  const picks = ['Säntis', 'Eiger'].map(cat => {
    const items = (window.PRODUCTS || []).filter(p => p.category === cat);
    return items.length ? { cat, product: items[0], min: Math.min(...items.map(p => p.price)) } : null;
  }).filter(Boolean);

  useEffect(() => {
    if (!window.WFMotion) return undefined;
    return WFMotion.scope(ref.current, () => {
      const { gsap } = WFMotion;
      gsap.fromTo('.cta-stage',
        { clipPath: 'inset(8% 6% 8% 6% round 32px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 28px)', ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top 90%', end: 'top 30%', scrub: true } });
      gsap.from('.cta-copy > *, .cta-pick', {
        y: 36, opacity: 0, duration: 1, stagger: 0.09, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 65%' },
      });
    });
  }, []);

  return (
    <section className="cta-band" id="kaufen" ref={ref}>
      <div className="container">
        <div className="cta-stage">
          <div className="cta-glow" aria-hidden="true"></div>
          <div className="cta-copy">
            <span className="idx">Nr. 04 — Dein Licht</span>
            <h2>Licht, das<br/><em>bleibt.</em></h2>
            <p>
              Wähle dein Format. Jedes Stück wird in Salmsach von Hand gegossen
              und kommt einsatzbereit mit Docht und Sojawachs-Startfüllung.
            </p>
          </div>
          <div className="cta-picks">
            {picks.map(({ cat, product, min }) => (
              <a key={cat} className="cta-pick" href={`shop.html#${cat}`}>
                <img src={product.img} alt={`${cat} Wachsfresser`} loading="lazy"/>
                <div className="cta-pick-text">
                  <span className="k">{cat}</span>
                  <span className="t">{cat === 'Eiger' ? 'Massiv · nur Aussenbereich' : 'Kompakt · Glasfaserdocht'}</span>
                </div>
                <span className="p">ab {formatChf(min)}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* === MARQUEE === */
function Strip() {
  const trackRef = useRef(null);
  useEffect(() => window.WFMotion ? WFMotion.marquee(trackRef.current) : undefined, []);
  const items = [
    'Handgegossen', 'Sojawachs-Startfüllung', 'Dauerdocht', 'Wiederbefüllbar',
    'Aus Salmsach', 'Wachs nachlegen', 'Creme & Anthrazit', 'Outdoor-Modell',
  ];
  const row = (k) => (
    <span key={k} aria-hidden={k > 0 ? 'true' : undefined}>
      {items.map((t, i) => (
        <React.Fragment key={i}>
          <span className={i % 2 ? 'strip-serif' : ''}>{t}</span>
          <span className="dot"></span>
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <div className="strip">
      <div className="strip-track" ref={trackRef}>
        {[0, 1, 2, 3].map(row)}
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
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} onOpen={onOpen} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* === ABOUT / WACHSFRESSER === */
function About() {
  const ref = useRef(null);
  useEffect(() => {
    if (!window.WFMotion) return undefined;
    return WFMotion.scope(ref.current, () => {
      const { gsap } = WFMotion;
      gsap.utils.toArray('.about-mosaic .img img').forEach((img, i) => {
        const drift = 4 + i * 1.5;
        gsap.fromTo(img, { yPercent: -drift, scale: 1.18 }, {
          yPercent: drift, ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
      gsap.fromTo('.process-line', { scaleX: 0 }, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.process', start: 'top 85%', end: 'bottom 60%', scrub: true },
      });
    });
  }, []);
  return (
    <section className="about" id="wachsfresser" ref={ref}>
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
          <span className="process-line" aria-hidden="true"></span>
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

Object.assign(window, { Nav, Hero, Hero3D, StickyBuyBar, CtaBand, Strip, Featured, About, Footer, CartDrawer, Reveal });
