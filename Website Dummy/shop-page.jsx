/* shop-page.jsx — Shop im Plakat-Stil: grosse Produktfotos, Filter, Vergleich */
const { useState: useStateP, useEffect: useEffectP, useLayoutEffect: useLayoutEffectP, useRef: useRefP } = React;

function ShopCard({ product, onAdd, hidden }) {
  const model = modelOf(product);
  const color = colorOf(product);
  const info = MODEL_INFO[model];
  const imgRef = useRefP(null);
  return (
    <article className="pcard" data-model={model} data-color={color} style={{ background: info.tint, display: hidden ? 'none' : undefined }}>
      <a className="pmedia" href={productUrl(product)} aria-label={`${product.name} ansehen`}>
        <img className="main" ref={imgRef} src={product.img} alt={`${info.name} in ${COLOR_NAME[color]}`}/>
        <img className="alt" src={info.scene} alt="" loading="lazy"/>
        <span className="pbadges">
          <span className="pbadge">{info.name} · {info.altitude} m</span>
          {info.outdoorOnly && <span className="psign">Nur für draussen</span>}
        </span>
        <span className="phint">{info.sceneLabel}</span>
      </a>
      <div className="pinfo">
        <div className="pinfo-top">
          <h2>{info.name}<small>{info.kind} · {COLOR_NAME[color]}</small></h2>
          <span className="pprice num">{chf(product.price)}</span>
        </div>
        <span className="pmeta">{info.wick}{info.lid ? ` · ${info.lid}` : ''} · mit Sojawachs gefüllt</span>
        <div className="pactions">
          <button className="btn btn-ink" type="button" data-magnetic onClick={() => onAdd(product, imgRef.current)}>In den Warenkorb</button>
          <a className="btn btn-ghost" href={productUrl(product)}>Ansehen</a>
        </div>
      </div>
    </article>
  );
}

function ShopPage({ onAdd }) {
  const ref = useRefP(null);
  const tvRef = useRefP(null);
  const flipState = useRefP(null);
  const [filter, setFilter] = useStateP(() => {
    const hash = decodeURIComponent(window.location.hash.replace('#', '')).toLowerCase();
    const model = hash === 'säntis' || hash === 'saentis' ? 'saentis' : hash === 'eiger' ? 'eiger' : 'all';
    return { model, color: 'all' };
  });
  const M = window.WFMotion;
  const anim = !!(M && M.enabled && window.Flip);

  const visible = (p) => (filter.model === 'all' || modelOf(p) === filter.model) && (filter.color === 'all' || colorOf(p) === filter.color);
  const count = PRODUCTS.filter(visible).length;

  const change = (key, value) => {
    if (anim) flipState.current = Flip.getState(ref.current.querySelectorAll('.pcard'));
    setFilter(f => ({ ...f, [key]: value }));
  };

  // Karten fliessen nach einem Filterwechsel an ihren neuen Platz
  useLayoutEffectP(() => {
    if (!flipState.current) return;
    const state = flipState.current;
    flipState.current = null;
    Flip.from(state, {
      duration: .7, ease: 'power3.inOut', absolute: true, scale: true,
      onEnter: els => M.gsap.fromTo(els, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .6, ease: 'expo.out' }),
      onLeave: els => M.gsap.to(els, { opacity: 0, scale: .9, duration: .35 }),
    });
  }, [filter.model, filter.color]);

  useEffectP(() => {
    tvRef.current.innerHTML = AlpenVessel.vesselMarkup('tv', { model: 'saentis', color: 'creme' });
    if (!M || !M.enabled) return undefined;
    if (window.Flip) M.gsap.registerPlugin(Flip);
    const tws = AlpenVessel.live(tvRef.current, M.gsap);
    const offReveal = M.reveal(ref.current);
    const ctx = M.gsap.context(() => {
      const { gsap } = M;
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .from('.head-range .far', { yPercent: 40, duration: 1.6 }, 0)
        .from('.head-range .mid', { yPercent: 50, duration: 1.6 }, .05)
        .from('.head-range .near', { yPercent: 60, duration: 1.6 }, .1)
        .from('.shop-head h1 .ch', { yPercent: 110, opacity: 0, rotate: 6, duration: 1, stagger: .05 }, .1)
        .from('.crumbs, .shop-head p', { y: 16, opacity: 0, duration: .9, stagger: .1 }, .4)
        .from('.head-photo', { clipPath: 'inset(100% 0 0 0 round 999px 999px 6px 6px)', duration: 1.4, ease: 'power3.inOut' }, .3)
        .from('.head-photo img', { scale: 1.3, duration: 1.8 }, .3)
        .from('.toolbar', { y: 20, opacity: 0, duration: .9 }, .6)
        .from('.pcard', { y: 60, opacity: 0, duration: 1.1, stagger: .1 }, .7);
      gsap.from('.crow', { x: -30, opacity: 0, duration: .8, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.ctable', start: 'top 80%' } });
      gsap.from('.teaser', { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.teaser', start: 'top 85%' } });
    }, ref.current);
    return () => { ctx.revert(); offReveal(); tws.forEach(t => t.kill()); };
  }, []);
  useInteractions(ref);

  const pill = (key, value, label, dot) => (
    <button className="pill" type="button" aria-pressed={filter[key] === value} onClick={() => change(key, value)}>
      {dot && <i style={{ background: dot }}></i>}{label}
    </button>
  );

  return (
    <main ref={ref}>
      <section className="shop-head">
        <div className="head-frame" aria-hidden="true"></div>
        <div className="head-grid">
          <div className="head-copy">
            <nav className="crumbs caps" aria-label="Pfad"><a href="Wachsfresser.html">Start</a><span>/</span><span aria-current="page">Shop</span></nav>
            <SplitTitle text="Shop"/>
            <p>Säntis und Eiger, je in Creme und Anthrazit. Jedes Gefäss ist von Hand gegossen und kommt mit Docht und einer Füllung aus Sojawachs.</p>
          </div>
          <figure className="head-photo">
            <img src={IMG + 'hero-outdoor-eiger.jpg'} alt="Zwei brennende Eiger-Wachsfresser in Creme und Anthrazit auf einem Gartentisch"/>
            <span>Eiger in Creme und Anthrazit</span>
          </figure>
        </div>
        <div className="head-range" aria-hidden="true">
          <svg viewBox="0 0 1440 200" preserveAspectRatio="none">
            <polygon className="far" fill="#bccbd9" points="0,90 140,50 260,80 380,30 520,85 660,40 800,90 940,20 1080,70 1220,35 1340,75 1440,50 1440,200 0,200"/>
            <polygon className="mid" fill="#7d9bb8" points="0,140 160,90 300,120 420,70 560,130 700,95 860,140 1000,80 1140,125 1300,90 1440,120 1440,200 0,200"/>
            <polygon className="near" fill="#30506f" points="0,180 200,150 380,170 560,140 760,175 940,150 1140,172 1300,152 1440,168 1440,200 0,200"/>
          </svg>
        </div>
      </section>

      <div className="wrap">
        <div className="toolbar">
          <div className="filters">
            <div className="pills" role="group" aria-label="Modell">
              {pill('model', 'all', 'Alle')}
              {pill('model', 'saentis', 'Säntis')}
              {pill('model', 'eiger', 'Eiger')}
            </div>
            <div className="pills" role="group" aria-label="Farbe">
              {pill('color', 'all', 'Alle Farben')}
              {pill('color', 'creme', 'Creme', SWATCH.creme)}
              {pill('color', 'anthrazit', 'Anthrazit', SWATCH.anthrazit)}
            </div>
          </div>
          <span className="count caps" aria-live="polite">{count} {count === 1 ? 'Produkt' : 'Produkte'}</span>
        </div>

        <div className="shop-cards">
          {PRODUCTS.map(p => <ShopCard key={p.id} product={p} onAdd={onAdd} hidden={!visible(p)}/>)}
        </div>

        <section className="compare" aria-labelledby="cmp-h">
          <span className="kicker caps">Vergleich</span>
          <h2 className="sec-h" id="cmp-h">Säntis oder Eiger?</h2>
          <div className="ctable" role="table" aria-label="Vergleich Säntis und Eiger">
            <div className="crow head-row" role="row"><span role="columnheader"></span><b role="columnheader">Säntis</b><b role="columnheader">Eiger</b></div>
            <div className="crow" role="row"><span>Grösse</span><span>Klein</span><span>Gross</span></div>
            <div className="crow" role="row"><span>Docht</span><span>Glasfaserdocht</span><span>Holzfaserdocht</span></div>
            <div className="crow" role="row"><span>Deckel</span><span>Ohne</span><span>Holzdeckel</span></div>
            <div className="crow" role="row"><span>Hinweis</span><span>–</span><span className="yes">Nur für draussen</span></div>
            <div className="crow" role="row"><span>Farben</span><span>Creme, Anthrazit</span><span>Creme, Anthrazit</span></div>
            <div className="crow" role="row"><span>Preis</span><span className="num">CHF 14.99</span><span className="num">CHF 59.99</span></div>
          </div>
        </section>

        <section className="facts" aria-label="Gut zu wissen">
          <div className="fact" data-reveal=""><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="21" fill="#f1d3a6"/><path d="M22 10c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.6-4.8 3-6 .2 2 1 3 2.4 3.6 0-3.6 0-6.4.6-9.6Z" fill="#e8843a"/></svg><div><b>Direkt startklar</b>Docht und Sojawachs sind schon drin.</div></div>
          <div className="fact" data-reveal="" data-delay=".08"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="21" fill="#c7d6e4"/><path d="M8 32 18 16l6 9 4-5 8 12Z" fill="#30506f"/></svg><div><b>Von Hand gegossen</b>In Salmsach im Thurgau.</div></div>
          <div className="fact" data-reveal="" data-delay=".16"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="21" fill="#f6c400"/><path d="M11 16h14v12H11zM25 20h5l3 4v4h-8" fill="none" stroke="#1c2837" strokeWidth="2" strokeLinejoin="round"/><circle cx="16" cy="29" r="2.4" fill="#1c2837"/><circle cx="29" cy="29" r="2.4" fill="#1c2837"/></svg><div><b>Versand in der Schweiz</b>Meist in rund 3 Werktagen bei dir.</div></div>
        </section>

        <section className="teaser" aria-labelledby="t-h">
          <div aria-hidden="true"><svg viewBox="-20 -60 460 520"><g ref={tvRef}></g></svg></div>
          <div>
            <span className="kicker caps" style={{ color: 'var(--sign)' }}>Zum ersten Mal hier?</span>
            <h2 id="t-h">So funktioniert ein Wachsfresser</h2>
            <p>Kerzenreste einfüllen und anzünden. Gefäss und Docht bleiben, nur das Wachs wird ersetzt.</p>
            <div className="btns"><a className="btn btn-sun" href="Wachsfresser.html#prinzip" data-magnetic>Zur Erklärung</a></div>
          </div>
        </section>
      </div>
    </main>
  );
}

window.ShopPage = ShopPage;
