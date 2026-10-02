/* product-page.jsx — dedicated product page */
const { useState: useStatePP, useEffect: useEffectPP, useMemo: useMemoPP } = React;

function ProductPage({ product, onAdd }) {
  const [qty, setQty] = useStatePP(1);
  const [added, setAdded] = useStatePP(false);
  const [view, setView] = useStatePP(0);
  const mainImgRef = React.useRef(null);
  const rootRef = React.useRef(null);

  // Galerie: weiche Überblendung beim Bildwechsel (ohne Transform, der Bildausschnitt bleibt)
  useEffectPP(() => {
    if (!window.WFMotion || !WFMotion.enabled || !mainImgRef.current) return;
    WFMotion.gsap.fromTo(mainImgRef.current, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out', clearProps: 'filter' });
  }, [view]);

  // Infos staffeln sich beim Laden herein
  useEffectPP(() => {
    if (!window.WFMotion || !product) return undefined;
    return WFMotion.scope(rootRef.current, () => {
      const { gsap } = WFMotion;
      gsap.from('.pp-info > *', { y: 28, opacity: 0, duration: 1, stagger: 0.06, ease: 'power3.out', delay: 0.1 });
      gsap.from('.pp-main-img', { clipPath: 'inset(6% 6% 6% 6%)', duration: 1.4, ease: 'expo.out' });
      const magnet = WFMotion.magnetic(document.querySelector('.pp-actions .add-big'), 0.15);
      return magnet;
    });
  }, [product && product.id]);

  const gallery = useMemoPP(() => {
    if (!product) return [];
    const objectPos = product.crop === 'left' ? '0% 50%'
      : product.crop === 'right' ? '100% 50%' : '50% 50%';
    const scale = product.crop === 'center' ? 'scale(1.02)' : 'scale(1.4)';
    const extra = product.category === 'Eiger'
      ? [
          { src: product.id.includes('creme') ? 'assets/product/eiger-creme-closed.jpg' : 'assets/product/eiger-anthrazit-closed.jpg', pos: '50% 50%', scale: 'scale(1.02)', label: 'Mit Holzdeckel' },
          { src: 'assets/product/eiger-dinner-scene.jpg', pos: '50% 50%', scale: 'scale(1.02)', label: 'In Szene' },
        ]
      : [
          { src: 'assets/product/saentis-indoor-scene.jpg', pos: '50% 50%', scale: 'scale(1.0)', label: 'In Szene' },
          { src: product.id.includes('creme') ? 'assets/product/saentis-creme.jpg' : 'assets/product/saentis-anthrazit.jpg', pos: '50% 50%', scale: 'scale(1.02)', label: 'Detail' },
        ];
    return [
      { src: product.img, pos: objectPos, scale, label: 'Produkt' },
      ...extra,
    ];
  }, [product?.id]);

  const variants = useMemoPP(() => {
    if (!product) return [];
    return PRODUCTS.filter(p => p.category === product.category);
  }, [product?.id]);

  const related = useMemoPP(() => {
    if (!product) return [];
    return PRODUCTS.filter(p => p.id !== product.id && p.category !== product.category).slice(0, 3);
  }, [product?.id]);

  useEffectPP(() => {
    setQty(1);
    setAdded(false);
    setView(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [product?.id]);

  if (!product) {
    return (
      <section className="pp">
        <div className="container">
          <div className="pp-not-found">
            <h2>Stück nicht gefunden.</h2>
            <p>Vielleicht wurde die Produktseite verschoben. Schau in der Kollektion vorbei.</p>
            <a href="shop.html" className="hero-cta">
              Zur Kollektion
              <span className="arrow">→</span>
            </a>
          </div>
        </div>
      </section>
    );
  }

  const handleAdd = () => {
    onAdd(product, mainImgRef.current, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const current = gallery[view];
  const price = `CHF ${Number(product.price).toFixed(2)}`;
  const isEiger = product.category === 'Eiger';

  return (
    <section className="pp" ref={rootRef}>
      <div className="container">
        <nav className="pp-crumbs" aria-label="Breadcrumb">
          <a href="Wachsfresser.html">Start</a>
          <span className="sep">/</span>
          <a href="shop.html">Shop</a>
          <span className="sep">/</span>
          <a href={`shop.html#${product.category}`}>{product.category}</a>
          <span className="sep">/</span>
          <span className="here">{product.name}</span>
        </nav>

        <div className="pp-grid">
          <div className="pp-gallery">
            <div className="pp-thumbs">
              {gallery.map((g, i) => (
                <button
                  key={`${g.src}-${i}`}
                  className={`pp-thumb ${i === view ? 'active' : ''}`}
                  onClick={() => setView(i)}
                  aria-label={g.label}
                >
                  <img src={g.src} alt={g.label} style={{ objectPosition: g.pos, transform: g.scale }}/>
                </button>
              ))}
            </div>
            <div className="pp-main-img">
              <img
                key={view}
                ref={mainImgRef}
                src={current.src}
                alt={product.name}
                style={{ objectPosition: current.pos, transform: current.scale }}
              />
              {product.badge && <span className="badge">{product.badge}</span>}
              <span className="edition">Handgegossen in Salmsach</span>
            </div>
          </div>

          <div className="pp-info">
            <span className="pp-cat">{product.category} · Wachsfresser</span>
            <h1>{product.name}</h1>
            <p className="pp-tagline">{product.desc}</p>

            <div className="pp-price-row">
              <span className="pp-price">{price}</span>
              <span className="pp-stock">Auf Lager</span>
            </div>

            {variants.length > 1 && (
              <div className="pp-variants">
                <span className="label">Farbe</span>
                <div className="pp-swatches">
                  {variants.map(v => (
                    <a
                      key={v.id}
                      href={`product.html?id=${v.id}`}
                      className={`pp-swatch ${v.id === product.id ? 'active' : ''}`}
                    >
                      <span className="dot" style={{ background: v.color }}></span>
                      {v.name.split('·').pop().trim()}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="pp-actions">
              <div className="qty-stepper">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Weniger">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(qty + 1)} aria-label="Mehr">+</button>
              </div>
              <button className="add-big" onClick={handleAdd}>
                {added ? '✓ Hinzugefügt' : `In den Warenkorb · CHF ${(product.price * qty).toFixed(2)}`}
              </button>
            </div>

            <div className="pp-trust">
              <div className="row">Einsatzbereit mit Docht und Sojawachs-Startfüllung</div>
              <div className="row">Versand Schweiz ca. 3 Werktage · Europaweit möglich</div>
              <div className="row">Handgegossen in Salmsach · Farbe und Oberfläche können leicht variieren</div>
            </div>

            <div className="pp-specs">
              {product.meta.map((m, i) => {
                const labels = ['Docht', 'Hinweis', 'Nutzung', 'Detail'];
                return (
                  <div className="spec" key={i}>
                    <span className="k">{labels[i] || 'Detail'}</span>
                    <span className="v">{m}</span>
                  </div>
                );
              })}
              <div className="spec">
                <span className="k">Lieferumfang</span>
                <span className="v">Betongefäss, Docht, Startfüllung</span>
              </div>
              <div className="spec">
                <span className="k">Brenndauer</span>
                <span className="v">Testlauf offen</span>
              </div>
              <div className="spec">
                <span className="k">Herkunft</span>
                <span className="v">Salmsach, Schweiz</span>
              </div>
            </div>

            <div className="pp-acc">
              <details open>
                <summary>Beschreibung</summary>
                <div className="body">
                  <p>{product.long}</p>
                  {isEiger && (
                    <p>Hinweis: Eiger ist nur für den Aussenbereich vorgesehen.</p>
                  )}
                </div>
              </details>
              <details>
                <summary>Nutzung &amp; Pflege</summary>
                <div className="body">
                  <ul>
                    <li>Wachsfresser nur auf eine stabile, hitzebeständige Unterlage stellen.</li>
                    <li>Wachsreste nur bis etwa 1 cm unter den Docht nachfüllen.</li>
                    <li>Brennenden Wachsfresser nie unbeaufsichtigt lassen.</li>
                    <li>Russ am Docht kann vorsichtig entfernt werden, sobald alles vollständig ausgekühlt ist.</li>
                    <li>Der Docht kann grundsätzlich ersetzt werden; passende Ersatzdochte sind noch nicht als Shop-Produkt angelegt.</li>
                  </ul>
                </div>
              </details>
              <details>
                <summary>Versand</summary>
                <div className="body">
                  <p>Versand in der Schweiz dauert in der Regel rund 3 Werktage. Europaweiter Versand ist grundsätzlich möglich; konkrete Versandkosten werden noch finalisiert.</p>
                </div>
              </details>
              <details>
                <summary>Material</summary>
                <div className="body">
                  <p>Korpus: handgegossenes Betongefäss in Creme oder Anthrazit. Startfüllung: Sojawachs. Docht: bei Säntis Glasfaserdocht, bei Eiger Holzfaserdocht. Die Eiger-Variante hat zusätzlich einen Holzdeckel.</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        <div className="pp-story">
          <div>
            <p className="quote">
              "Das Gefäss bleibt.
              Du legst Wachs nach, und das Licht kommt zurück."
            </p>
            <p className="who">Aus Salmsach · Wachsfresser Schweiz</p>
          </div>
          <div className="img">
            <img src={isEiger ? 'assets/product/eiger-dinner-scene.jpg' : 'assets/product/saentis-indoor-scene.jpg'} alt="Wachsfresser aus handgegossenem Beton"/>
          </div>
        </div>

        {related.length > 0 && (
          <div className="pp-related">
            <div className="pp-related-head">
              <h2>Passt <em>dazu.</em></h2>
              <a href="shop.html" className="idx" style={{ color: 'var(--ink)' }}>Alle ansehen →</a>
            </div>
            <div className="shop-grid">
              {related.map(p => (
                <ProductCard key={p.id} product={p} onAdd={onAdd} onOpen={() => { window.location.href = `product.html?id=${p.id}`; }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

window.ProductPage = ProductPage;
