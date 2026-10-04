/* product-view.jsx — Produktseite: echte Fotos, Kaufbox, Erklärung, Daten */
const { useState: useStateV, useEffect: useEffectV, useRef: useRefV } = React;

function Gallery({ images, productName, imgRef }) {
  const [view, setView] = useStateV(0);
  const [zoom, setZoom] = useStateV(false);
  const stageRef = useRefV(null);
  const touchX = useRefV(null);
  const M = window.WFMotion;
  const current = images[view];

  const show = (i) => {
    const next = (i + images.length) % images.length;
    if (next === view) return;
    setZoom(false);
    if (M && M.enabled) {
      M.gsap.to(imgRef.current, { opacity: 0, scale: 1.04, duration: .2, ease: 'power2.in', onComplete: () => setView(next) });
    } else setView(next);
  };
  useEffectV(() => {
    if (M && M.enabled) M.gsap.fromTo(imgRef.current, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: .6, ease: 'expo.out', clearProps: 'transform' });
  }, [view]);

  const onMove = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    stageRef.current.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    stageRef.current.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const fine = M && M.finePointer;

  return (
    <div className="gallery">
      <div
        className={`stage ${zoom ? 'zoom' : ''}`}
        ref={stageRef}
        onPointerMove={fine ? onMove : undefined}
        onPointerLeave={() => setZoom(false)}
        onClick={e => { if (fine && !e.target.closest('button')) setZoom(z => !z); }}
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) show(view + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <img ref={imgRef} src={current.src} alt={`${productName}: ${current.label}`}/>
        <div className="stage-frame" aria-hidden="true"></div>
        <span className="stage-cap">{current.label}</span>
        <div className="stage-nav">
          <button type="button" aria-label="Vorheriges Bild" onClick={() => show(view - 1)}>←</button>
          <button type="button" aria-label="Nächstes Bild" onClick={() => show(view + 1)}>→</button>
        </div>
      </div>
      <div className="thumbs" role="group" aria-label="Bilder">
        {images.map((g, k) => (
          <button key={g.src + k} type="button" aria-label={g.label} aria-current={k === view} onClick={() => show(k)}>
            <img src={g.src} alt=""/>
          </button>
        ))}
      </div>
    </div>
  );
}

/* Kleine Endlos-Szene: Reste fallen hinein, Flamme zündet */
function HowLoop({ model, color }) {
  const ref = useRefV(null);
  useEffectV(() => {
    const root = ref.current;
    root.querySelector('.how-vessel').innerHTML = AlpenVessel.vesselMarkup('hw', { model, color });
    root.querySelector('.how-stubs').innerHTML = [0, 1, 2].map(AlpenVessel.stubMarkup).join('');
    const M = window.WFMotion;
    if (!M || !M.enabled) return undefined;
    const { gsap } = M;
    const vessel = root.querySelector('.how-vessel');
    const flame = AlpenVessel.live(vessel, gsap);
    const stubs = [...root.querySelectorAll('.how-stubs .v-stub')];
    gsap.set(root.querySelector('.how-stubs'), { opacity: 1 });
    gsap.set(stubs, { opacity: 0 });
    const wind = vessel.querySelector('.v-wind');
    gsap.set(wind, { transformOrigin: '50% 100%' });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true });
    tl.to(wind, { scale: 0, duration: .5, ease: 'power2.in' })
      .to(vessel.querySelector('.v-halo'), { opacity: .2, duration: .5 }, '<');
    stubs.forEach((s, i) => {
      tl.fromTo(s, { x: 90 + i * 110, y: -120, rotation: -30 + i * 30, opacity: 1, scale: 1 }, { x: 200, y: 176, rotation: 0, duration: .6, ease: 'power2.in', immediateRender: false }, `>-${i ? .25 : 0}`)
        .to(s, { scale: .3, opacity: 0, duration: .15, transformOrigin: '50% 100%' }, '>')
        .fromTo(vessel.querySelector('.v-wax'), { scaleY: 1 }, { scaleY: 1.3, duration: .12, yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, '<');
    });
    tl.to(wind, { scale: 1, duration: .9, ease: 'elastic.out(1, .45)' }, '+=.2')
      .to(vessel.querySelector('.v-halo'), { opacity: 1, duration: .8 }, '<')
      .to({}, { duration: 2.4 });
    const st = M.ScrollTrigger.create({ trigger: root, start: 'top 80%', end: 'bottom 10%', onToggle: self => (self.isActive ? tl.play() : tl.pause()) });
    return () => { st.kill(); tl.kill(); flame.forEach(t => t.kill()); };
  }, [model, color]);
  return (
    <section className="how" aria-labelledby="how-h" ref={ref}>
      <div aria-hidden="true"><svg viewBox="-60 -60 540 520"><g className="how-vessel"></g><g className="how-stubs"></g></svg></div>
      <div>
        <span className="kicker caps">So funktioniert’s</span>
        <h2 className="sec-h" id="how-h">Kerzenreste einfüllen und anzünden</h2>
        <div className="how-steps">
          <div><b>Einfüllen</b>Reste höchstens bis 1 cm unter den Docht.</div>
          <div><b>Anzünden</b>Der Docht bleibt im Gefäss.</div>
          <div><b>Nachfüllen</b>Ist das Wachs heruntergebrannt, kommen neue Reste hinein.</div>
        </div>
      </div>
    </section>
  );
}

const CARE = [
  'Den Wachsfresser nur auf eine stabile, hitzebeständige Unterlage stellen.',
  'Wachsreste höchstens bis etwa 1 cm unter den Docht einfüllen.',
  'Brennende Wachsfresser nie unbeaufsichtigt lassen.',
  'Russ am Docht erst entfernen, wenn alles ganz ausgekühlt ist.',
];

function ProductView({ product, onAdd, overlayOpen }) {
  const rootRef = useRefV(null);
  const imgRef = useRefV(null);
  const crossImgRef = useRefV(null);
  const actionsRef = useRefV(null);
  const [qty, setQty] = useStateV(1);
  const [barVisible, setBarVisible] = useStateV(false);

  // Mobile Kaufleiste, sobald der Hauptbutton aus dem Bild ist
  useEffectV(() => {
    if (!actionsRef.current) return undefined;
    const io = new IntersectionObserver(([e]) => setBarVisible(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(actionsRef.current);
    return () => io.disconnect();
  }, [product && product.id]);

  useMotion(rootRef, () => {
    if (!product) return;
    const { gsap } = WFMotion;
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .from('.stage', { clipPath: 'inset(8% 8% 8% 8% round 6px)', duration: 1.3 })
      .from('.thumbs button', { y: 20, opacity: 0, duration: .8, stagger: .06 }, .3)
      .from('.buy > *', { y: 28, opacity: 0, duration: 1, stagger: .06 }, .15);
    gsap.from('.posts .sign', { rotate: -12, x: -24, opacity: 0, duration: 1.1, stagger: .08, ease: 'elastic.out(1, .55)', scrollTrigger: { trigger: '.posts', start: 'top 85%' } });
    gsap.fromTo('.scene img', { yPercent: -8, scale: 1.15 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.scene', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.scene figcaption', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.scene', start: 'top 70%' } });
    gsap.from('.cross', { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.cross', start: 'top 85%' } });
  }, [product && product.id]);
  useInteractions(rootRef, [product && product.id]);

  if (!product) {
    return (
      <main className="pp" ref={rootRef}>
        <div className="wrap" style={{ paddingBlock: '80px', display: 'grid', gap: '16px', justifyItems: 'start' }}>
          <h1 className="sec-h">Dieses Produkt gibt es nicht</h1>
          <p>Vielleicht ist der Link veraltet. Im Shop findest du alle Wachsfresser.</p>
          <a className="btn btn-ink" href="shop.html">Zum Shop</a>
        </div>
      </main>
    );
  }

  const model = modelOf(product);
  const color = colorOf(product);
  const info = MODEL_INFO[model];
  const images = info.gallery[color].map(([f, label]) => ({ src: IMG + f, label }));
  const other = findProduct(model === 'saentis' ? 'eiger' : 'saentis', color);
  const otherInfo = MODEL_INFO[modelOf(other)];
  const specs = [
    ['Grösse', info.size], ['Docht', info.wick], ['Füllung', 'Sojawachs'],
    ['Deckel', info.lid || 'Ohne'], ['Herkunft', 'Salmsach TG'], ['Brenndauer', 'Wird noch getestet'],
  ];

  return (
    <main className="pp" ref={rootRef} style={{ '--tint': info.tint }}>
      <div className="wrap">
        <nav className="crumbs caps" aria-label="Pfad">
          <a href="Wachsfresser.html">Start</a><span>/</span><a href="shop.html">Shop</a><span>/</span>
          <span aria-current="page">{info.name} · {COLOR_NAME[color]}</span>
        </nav>

        <div className="pp-grid">
          <Gallery images={images} productName={product.name} imgRef={imgRef}/>

          <div className="buy">
            <span className="badge caps">
              <svg viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true"><polygon fill="#30506f" points={info.ridge}/></svg>
              {info.name} · {info.altitude} m ü. M.
            </span>
            <h1>{info.name}<small>{info.kind} · {COLOR_NAME[color]}</small></h1>
            <div className="price-row"><span className="price num">{chf(product.price)}</span><span className="stock">Auf Lager</span></div>
            <p className="buy-lead">{product.desc}</p>
            {info.outdoorOnly && <div className="warn">Nur für den Aussenbereich</div>}
            <div>
              <span className="buy-label caps">Farbe · {COLOR_NAME[color]}</span>
              <div className="colors">
                {['creme', 'anthrazit'].map(c => {
                  const q = findProduct(model, c);
                  return <a key={c} className="color" href={productUrl(q)} aria-current={c === color}><img src={q.img} alt=""/>{COLOR_NAME[c]}</a>;
                })}
              </div>
            </div>
            <div className="actions" ref={actionsRef}>
              <div className="qty-pick" role="group" aria-label="Menge">
                <button type="button" aria-label="Weniger" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="num" aria-live="polite">{qty}</span>
                <button type="button" aria-label="Mehr" onClick={() => setQty(q => Math.min(9, q + 1))}>+</button>
              </div>
              <button className="btn btn-sun" type="button" data-magnetic onClick={() => onAdd(product, imgRef.current, qty)}>
                In den Warenkorb · {chf(product.price * qty)}
              </button>
            </div>
            <div className="trust">
              <div><svg viewBox="0 0 22 22" aria-hidden="true"><path d="M11 2c.6 2.4 3.4 3.6 3.4 7a3.4 3.4 0 0 1-6.8 0c0-1.6.8-2.6 1.6-3.2.1 1.1.6 1.7 1.3 2 0-2 0-3.6.5-5.8Z" fill="#e8843a"/><rect x="6" y="13" width="10" height="7" rx="2" fill="#30506f"/></svg>Mit Docht und Sojawachs gefüllt, direkt startklar</div>
              <div><svg viewBox="0 0 22 22" aria-hidden="true"><path d="M2 18 9 7l4 6 3-3 4 8Z" fill="#30506f"/></svg>Von Hand gegossen in Salmsach. Farbe und Oberfläche weichen leicht ab.</div>
              <div><svg viewBox="0 0 22 22" aria-hidden="true"><rect x="2" y="6" width="11" height="9" rx="1" fill="#30506f"/><path d="M13 9h4l3 3v3h-7Z" fill="#30506f"/><circle cx="6" cy="17" r="2" fill="#e8843a"/><circle cx="16" cy="17" r="2" fill="#e8843a"/></svg>Versand in der Schweiz meist in rund 3 Werktagen</div>
            </div>
            <div className="acc">
              <details open><summary>Beschreibung</summary><div className="body"><p>{product.long}</p></div></details>
              <details><summary>Lieferumfang</summary><div className="body"><ul>
                <li>Betongefäss, von Hand gegossen</li><li>{info.wick}</li><li>Füllung aus Sojawachs</li>{info.lid && <li>{info.lid}</li>}
              </ul></div></details>
              <details><summary>Nutzung und Pflege</summary><div className="body"><ul>{CARE.map(c => <li key={c}>{c}</li>)}</ul></div></details>
              <details><summary>Versand</summary><div className="body"><p>Innerhalb der Schweiz meist rund 3 Werktage. Nach Deutschland, Österreich, Frankreich und Italien liefern wir auch; die Kosten siehst du im Checkout.</p></div></details>
            </div>
          </div>
        </div>

        <HowLoop model={model} color={color}/>

        <figure className="scene"><img src={info.scene} alt={info.sceneLabel} loading="lazy"/><figcaption>{info.sceneLabel}</figcaption></figure>

        <section className="specs" aria-labelledby="sp-h">
          <span className="kicker caps">Daten</span>
          <h2 className="sec-h" id="sp-h">Auf einen Blick</h2>
          <div className="posts">
            {specs.map(([k, v]) => <div className="post" key={k}><div className="sign"><span>{k}</span><b>{v}</b></div></div>)}
          </div>
        </section>

        <section className="cross" style={{ background: otherInfo.tint }}>
          <a className="pic" href={productUrl(other)}><img ref={crossImgRef} src={other.img} alt={`${otherInfo.name} in ${COLOR_NAME[color]}`} loading="lazy"/></a>
          <div>
            <span className="kicker caps">Auch erhältlich</span>
            <h2>{otherInfo.name}</h2>
            <p>{otherInfo.teaser}</p>
            <div className="btns">
              <a className="btn btn-ink" href={productUrl(other)}>{otherInfo.name} ansehen</a>
              <button className="btn btn-ghost" type="button" onClick={() => onAdd(other, crossImgRef.current)}>In den Warenkorb · {chf(other.price)}</button>
            </div>
          </div>
        </section>
      </div>

      <div className={`mbar ${barVisible && !overlayOpen ? 'show' : ''}`} aria-hidden={!(barVisible && !overlayOpen)}>
        <div><b>{info.name} · {COLOR_NAME[color]}</b><span className="num">{chf(product.price)}</span></div>
        <button className="btn btn-sun" type="button" tabIndex={barVisible && !overlayOpen ? 0 : -1} onClick={() => onAdd(product, imgRef.current, qty)}>In den Warenkorb</button>
      </div>
    </main>
  );
}

window.ProductView = ProductView;
