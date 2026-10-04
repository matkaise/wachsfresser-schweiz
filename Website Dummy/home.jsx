/* home.jsx — Startseite im Stil eines Schweizer Reiseplakats */
const { useState: useStateH, useEffect: useEffectH, useRef: useRefH } = React;

/* === Plakat mit Wachsfresser und Kaufleiste === */
function PosterHero({ onAdd }) {
  const [sel, setSel] = useStateH({ model: 'saentis', color: 'creme' });
  const product = findProduct(sel.model, sel.color);
  const rootRef = useRefH(null);
  const vesselRef = useRefH(null);
  const thumbRef = useRefH(null);
  const live = useRefH({ tws: [], windX: null, ready: false });
  const first = useRefH(true);
  const M = window.WFMotion;
  const anim = !!(M && M.enabled);

  const startLive = () => {
    if (!anim) return;
    live.current.tws.forEach(t => t.kill());
    live.current.tws = AlpenVessel.live(vesselRef.current, M.gsap);
    if (M.finePointer) {
      const w = vesselRef.current.querySelector('.v-wind');
      M.gsap.set(w, { transformOrigin: '50% 100%' });
      live.current.windX = M.gsap.quickTo(w, 'skewX', { duration: .9, ease: 'power3.out' });
    }
    live.current.ready = true;
  };

  // Erster Aufbau und Intro: Gefäss landet, Reste fallen hinein, Flamme zündet
  useEffectH(() => {
    vesselRef.current.innerHTML = AlpenVessel.vesselMarkup('hv', sel);
    rootRef.current.querySelector('.hero-stubs').innerHTML = [0, 1, 2].map(AlpenVessel.stubMarkup).join('');
    if (!anim) return undefined;
    const { gsap } = M;
    const ctx = gsap.context(() => {
      const stubs = gsap.utils.toArray('.hero-stubs .v-stub');
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: startLive });
      tl.from('.range .far', { yPercent: 16, duration: 1.8 }, 0)
        .from('.range .mid', { yPercent: 24, duration: 1.8 }, .05)
        .from('.range .near', { yPercent: 34, duration: 1.6 }, .1)
        .from('.poster-title h1 .ch', { yPercent: 120, opacity: 0, rotate: 8, duration: 1.1, stagger: .045 }, .15)
        .from('.poster-title .eyebrow, .poster-title p, .poster-top', { y: 20, opacity: 0, duration: 1, stagger: .1 }, .5)
        .from('#hv .v-body', { y: -420, duration: 1, ease: 'bounce.out' }, .55)
        .from('#hv .v-shadow', { scale: .2, opacity: 0, transformOrigin: '50% 50%', duration: 1, ease: 'bounce.out' }, .55)
        .set('#hv .v-flame', { scale: 0, transformOrigin: '50% 100%' }, 0)
        .set('#hv .v-halo', { scale: 0, opacity: 0, transformOrigin: '50% 50%' }, 0)
        .set('.hero-stubs', { opacity: 1 }, 1.4);
      stubs.forEach((s, i) => {
        const at = 1.45 + i * .32;
        tl.fromTo(s, { x: 120 + i * 80, y: -330, rotation: -40 + i * 40, opacity: 1 }, { x: 200, y: 176, rotation: 0, duration: .55, ease: 'power2.in' }, at)
          .to(s, { scale: .3, opacity: 0, duration: .15, ease: 'none', transformOrigin: '50% 100%' }, at + .55)
          .fromTo('#hv .v-wax', { scaleY: 1 }, { scaleY: 1.35, duration: .12, yoyo: true, repeat: 1, transformOrigin: '50% 50%', ease: 'power1.out' }, at + .55);
      });
      tl.to('#hv .v-flame', { scale: 1, duration: 1, ease: 'elastic.out(1, .45)' }, '+=.15')
        .to('#hv .v-halo', { scale: 1, opacity: 1, duration: 1.4 }, '<')
        .from('.hero-buy', { y: 30, opacity: 0, duration: 1 }, '<.1');

      const st = { trigger: '.poster', start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.range .far', { yPercent: -8, ease: 'none', scrollTrigger: st });
      gsap.to('.range .mid', { yPercent: -4, ease: 'none', scrollTrigger: st });
      gsap.to('.poster-title', { y: -60, opacity: .4, ease: 'none', scrollTrigger: st });
    }, rootRef.current);

    // Flamme neigt sich mit der Maus wie im Wind
    let lastX = null, t = null;
    const onMove = (e) => {
      const windX = live.current.windX;
      if (!windX) return;
      const dx = lastX === null ? 0 : e.clientX - lastX;
      lastX = e.clientX;
      windX(Math.max(-14, Math.min(14, -dx * .6)));
      clearTimeout(t);
      t = setTimeout(() => live.current.windX && live.current.windX(0), 120);
    };
    if (M.finePointer) window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      ctx.revert();
      live.current.tws.forEach(tw => tw.kill());
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  // Modell- oder Farbwechsel baut die Illustration um
  const prev = useRefH(sel);
  useEffectH(() => {
    if (first.current) { first.current = false; return; }
    const before = prev.current;
    prev.current = sel;
    const g = vesselRef.current;
    if (before.model !== sel.model) {
      if (!anim) { g.innerHTML = AlpenVessel.vesselMarkup('hv', sel); return; }
      const { gsap } = M;
      gsap.to(g, {
        scaleY: .2, scaleX: 1.2, opacity: 0, duration: .3, ease: 'power3.in', transformOrigin: '50% 100%', overwrite: true,
        onComplete: () => {
          live.current.tws.forEach(tw => tw.kill());
          live.current.windX = null;
          g.innerHTML = AlpenVessel.vesselMarkup('hv', sel);
          gsap.set(g.querySelector('.v-flame'), { scale: 0, transformOrigin: '50% 100%' });
          const tl = gsap.timeline({ onComplete: startLive });
          tl.to(g, { scaleY: 1, scaleX: 1, opacity: 1, duration: .9, ease: 'elastic.out(1, .5)' })
            .to(g.querySelector('.v-flame'), { scale: 1, duration: .8, ease: 'elastic.out(1, .45)' }, '-=.5');
          const lid = g.querySelector('.v-lid');
          if (lid) tl.from(lid, { rotation: 35, opacity: 0, transformOrigin: '100% 100%', duration: .7, ease: 'back.out(2)' }, '-=.9');
        },
      });
    } else if (before.color !== sel.color) {
      const C = AlpenVessel.COLORS[sel.color];
      const set = (el, prop, v) => (anim ? M.gsap.to(el, { [prop]: v, duration: .7, ease: 'power2.inOut' }) : (el.style[prop] = v));
      set(g.querySelector('.v-f1'), 'stopColor', C.f1);
      set(g.querySelector('.v-f2'), 'stopColor', C.f2);
      set(g.querySelector('.v-top'), 'fill', C.top);
      set(g.querySelector('.v-well'), 'fill', C.well);
      if (anim) M.gsap.fromTo(g, { rotation: -3 }, { rotation: 0, duration: 1, ease: 'elastic.out(1, .4)', transformOrigin: '50% 100%' });
    }
  }, [sel.model, sel.color]);

  useInteractions(rootRef);

  return (
    <div ref={rootRef}>
      <section className="poster" aria-labelledby="hero-title">
        <div className="poster-frame" aria-hidden="true"></div>
        <div className="poster-top caps"><span>Schweiz</span><span>Handgegossen in Salmsach, Thurgau</span></div>
        <div className="poster-title">
          <span className="eyebrow caps">Betongefäss mit Dauerdocht</span>
          <SplitTitle text="Wachsfresser" id="hero-title" />
          <p>Kerzenreste hineinlegen, Docht anzünden. <em>Nachfüllen statt wegwerfen.</em></p>
        </div>
        <div className="range">
          <svg viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice" role="img" aria-label="Illustration: ein brennender Wachsfresser aus Beton vor den Bergen Säntis und Eiger">
            <g className="layer far"><polygon fill="#bccbd9" points="0,330 120,280 210,310 320,240 420,300 520,262 640,320 760,236 860,292 980,214 1100,292 1200,252 1320,310 1440,270 1440,600 0,600"/></g>
            <g className="layer mid">
              <polygon fill="#7d9bb8" points="0,420 120,370 230,300 300,330 390,250 480,340 600,390 840,390 960,330 1060,190 1110,230 1180,210 1290,320 1440,350 1440,600 0,600"/>
              <polygon fill="#fbf7ef" points="370,268 390,250 414,270 401,266 390,278"/>
              <polygon fill="#fbf7ef" points="1035,215 1060,190 1088,212 1072,210 1060,226 1048,214"/>
              <line x1="384" y1="246" x2="342" y2="226" stroke="#1c2837" strokeWidth="1.5"/>
              <text className="peak-label" x="336" y="222" textAnchor="end">Säntis</text>
              <text className="peak-alt" x="336" y="238" textAnchor="end">2502 m ü. M.</text>
              <line x1="1066" y1="186" x2="1110" y2="166" stroke="#1c2837" strokeWidth="1.5"/>
              <text className="peak-label" x="1116" y="162">Eiger</text>
              <text className="peak-alt" x="1116" y="178">3967 m ü. M.</text>
            </g>
            <g className="layer near"><polygon fill="#30506f" points="0,540 140,500 300,520 440,486 540,472 900,472 1000,490 1120,470 1280,500 1440,480 1440,600 0,600"/></g>
            <g transform="translate(530 63.5) scale(.95)">
              <g id="hv" className="hero-vessel" ref={vesselRef}></g>
              <g className="hero-stubs"></g>
            </g>
          </svg>
        </div>
      </section>

      <div className="hero-buy" data-product>
        <img className="hb-thumb" ref={thumbRef} src={product.img} alt=""/>
        <div className="hb-info"><b>{MODEL_INFO[sel.model].name} · {COLOR_NAME[sel.color]}</b><span className="num">{chf(product.price)}</span></div>
        <div className="seg" role="group" aria-label="Modell" style={{ '--i': sel.model === 'eiger' ? 1 : 0 }}>
          <span className="seg-thumb" aria-hidden="true"></span>
          {['saentis', 'eiger'].map(m => (
            <button key={m} type="button" aria-pressed={sel.model === m} onClick={() => setSel(s => ({ ...s, model: m }))}>{MODEL_INFO[m].name}</button>
          ))}
        </div>
        <div className="dots" role="group" aria-label="Farbe">
          {['creme', 'anthrazit'].map(c => (
            <button key={c} type="button" style={{ background: SWATCH[c] }} aria-label={COLOR_NAME[c]} aria-pressed={sel.color === c} onClick={() => setSel(s => ({ ...s, color: c }))}></button>
          ))}
        </div>
        <button className="btn btn-sun" type="button" data-magnetic onClick={() => onAdd(product, thumbRef.current)}>In den Warenkorb</button>
      </div>
    </div>
  );
}

/* === Echte Fotos als Postkarten === */
function Postcards() {
  const ref = useRefH(null);
  const cards = [
    { id: 'eiger-gross-creme', img: 'hero-outdoor-eiger.jpg', alt: 'Zwei brennende Eiger-Wachsfresser in Creme und Anthrazit auf einem Gartentisch', cap: 'Eiger in Creme und Anthrazit auf dem Gartentisch', speed: -6 },
    { id: 'saentis-klein-creme', img: 'saentis-indoor-scene.jpg', alt: 'Ein brennender Säntis in Creme auf einem Holztisch im Wohnzimmer', cap: 'Säntis in Creme im Wohnzimmer', speed: 4, stamp: true },
    { id: 'eiger-gross-anthrazit', img: 'eiger-dinner-scene.jpg', alt: 'Zwei Eiger-Wachsfresser bei einem Abendessen im Freien', cap: 'Zwei Eiger beim Abendessen draussen', speed: -3 },
  ];
  useMotion(ref, () => {
    const { gsap } = WFMotion;
    gsap.from('.postcard', { y: 120, rotation: i => [-14, 12, -8][i], opacity: 0, duration: 1.3, stagger: .14, ease: 'expo.out', scrollTrigger: { trigger: '.postcards', start: 'top 85%' } });
    gsap.utils.toArray('.postcard').forEach(pc => gsap.to(pc, { y: Number(pc.dataset.speed) * 10, ease: 'none', scrollTrigger: { trigger: '.postcards', start: 'top bottom', end: 'bottom top', scrub: true } }));
  });
  return (
    <section className="cards-real" aria-labelledby="real-h" ref={ref}>
      <div className="wrap">
        <div className="real-head">
          <span className="kicker caps">Fotos</span>
          <h2 className="sec-h" id="real-h">Säntis und Eiger im Einsatz</h2>
        </div>
        <div className="postcards">
          {cards.map(c => (
            <a className="postcard" href={`product.html?id=${c.id}`} data-speed={c.speed} key={c.img}>
              <img src={IMG + c.img} alt={c.alt} loading="lazy"/>
              <span className="pc-cap">{c.cap}</span>
              {c.stamp && (
                <span className="stamp" aria-hidden="true">
                  <svg viewBox="0 0 60 70"><rect x="3" y="3" width="54" height="64" fill="#fbf7ef" stroke="#fbf7ef" strokeWidth="6" strokeDasharray="2 3"/><rect x="8" y="8" width="44" height="54" fill="#c7d6e4"/><polygon points="8,52 20,34 28,44 36,30 52,52 52,62 8,62" fill="#30506f"/><circle cx="40" cy="20" r="6" fill="#e8843a"/></svg>
                  <b>Schweiz</b>
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* === So funktioniert's: Szene folgt dem Scrollen === */
function Explainer() {
  const ref = useRefH(null);
  const steps = [
    ['Reste sammeln', 'Kerzenstummel und Wachsreste aufbewahren statt wegwerfen.'],
    ['Einfüllen', 'Die Reste in den Wachsfresser legen, höchstens bis 1 cm unter den Docht.'],
    ['Anzünden', 'Der Docht bleibt im Gefäss. Das Wachs schmilzt und hält die Flamme am Brennen.'],
    ['Nachfüllen', 'Ist das Wachs heruntergebrannt, kommen neue Reste hinein. Beim Kauf ist eine Füllung aus Sojawachs drin.'],
  ];
  useEffectH(() => {
    const root = ref.current;
    root.querySelector('#ev').innerHTML = AlpenVessel.vesselMarkup('ev', { model: 'saentis', color: 'creme' });
    root.querySelector('.ex-stubs').innerHTML = [0, 1, 2, 3, 4].map(AlpenVessel.stubMarkup).join('');
    const M = window.WFMotion;
    if (!M || !M.enabled) return undefined;
    const { gsap } = M;
    let flame = [];
    const ctx = gsap.context(() => {
      const stepsEl = gsap.utils.toArray('.ex-step');
      const stubs = gsap.utils.toArray('.ex-stubs .v-stub');
      const starts = [[-90, 150, -22], [500, 110, 18], [-60, 360, 14], [520, 330, -16], [230, -40, 10]];
      stubs.forEach((s, i) => gsap.set(s, { x: starts[i][0], y: starts[i][1], rotation: starts[i][2], opacity: 0 }));
      gsap.set('#ev .v-wind', { scale: 0, transformOrigin: '50% 100%' });
      gsap.set('#ev .v-halo', { scale: 0, opacity: 0, transformOrigin: '50% 50%' });
      gsap.set('#ev .v-wax', { attr: { cy: 181, rx: 66, ry: 8 } });
      gsap.set('#ev .v-embers', { opacity: 0 });
      gsap.set(stepsEl[0], { opacity: 1 });
      const active = (i) => stepsEl.map((s, k) => gsap.to(s, { opacity: k === i ? 1 : .3, duration: .4 }));
      gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: root, start: 'top 64px', end: '+=2600', scrub: .8, pin: root.querySelector('.ex-pin'), anticipatePin: 1 },
      })
        .to(stubs, { opacity: 1, y: '-=30', duration: 1, stagger: .12, ease: 'power2.out' })
        .to({}, { duration: .4 })
        .add(active(1))
        .to(stubs, { x: 200, y: 176, rotation: 0, duration: 1.6, stagger: .18, ease: 'power2.in' })
        .to(stubs, { scale: .25, opacity: 0, duration: .25, stagger: .18, transformOrigin: '50% 100%' }, '<1.4')
        .to('#ev .v-blob', { opacity: 1, duration: .3, stagger: .08 }, '<')
        .add(active(2))
        .to('#ev .v-wax', { attr: { cy: 171, rx: 78, ry: 11 }, duration: 1.4 })
        .to('#ev .v-blob', { scale: .2, opacity: 0, duration: 1.2, stagger: .1, transformOrigin: '50% 50%' }, '<.2')
        .to('#ev .v-wind', { scale: 1, duration: 1, ease: 'back.out(2)' })
        .to('#ev .v-halo', { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' }, '<')
        .to('#ev .v-embers', { opacity: 1, duration: .5 }, '<')
        .to(root, { backgroundColor: '#1f3048', color: '#fbf7ef', duration: 1.4 }, '<')
        .add(active(3))
        .to({}, { duration: .6 });
      flame = AlpenVessel.live(root.querySelector('#ev'), gsap, { halo: false });
    }, root);
    return () => { ctx.revert(); flame.forEach(t => t.kill()); };
  }, []);
  return (
    <section className="explain" id="prinzip" ref={ref}>
      <div className="ex-pin">
        <div className="wrap ex-grid">
          <div className="ex-text">
            <span className="kicker caps">So funktioniert’s</span>
            <h2 className="sec-h">Kerzenreste wiederverwenden</h2>
            <ol className="ex-steps">
              {steps.map(([t, d], i) => (
                <li className="ex-step" key={t}><span className="ex-num">{i + 1}</span><div><b>{t}</b><p>{d}</p></div></li>
              ))}
            </ol>
          </div>
          <div className="ex-art" aria-hidden="true">
            <svg viewBox="-150 -60 720 540"><g id="ev" className="ex-vessel"></g><g className="ex-stubs"></g></svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/* === Kollektion: zwei Plakatkarten mit echten Fotos === */
function CollectionCard({ model, onAdd, delay }) {
  const info = MODEL_INFO[model];
  const [color, setColor] = useStateH('creme');
  const product = findProduct(model, color);
  const imgRef = useRefH(null);
  const pick = (c) => {
    if (c === color) return;
    const M = window.WFMotion;
    if (M && M.enabled) {
      M.gsap.to(imgRef.current, { opacity: 0, scale: 1.05, duration: .25, onComplete: () => { setColor(c); M.gsap.to(imgRef.current, { opacity: 1, scale: 1, duration: .5, ease: 'expo.out', delay: .05 }); } });
    } else setColor(c);
  };
  return (
    <article className={`card ${model}`} data-product data-reveal="" data-delay={delay}>
      <div className="card-head">
        <h3>{info.name}<small>{info.kind}</small></h3>
        <div className="alt"><b className="num">{info.altitude} m</b><span className="caps">ü. M.</span></div>
      </div>
      <a className="arch" href={productUrl(product)} data-tilt="4" aria-label={`${product.name} ansehen`}>
        <img ref={imgRef} data-fly src={product.img} alt={`${info.name} in ${COLOR_NAME[color]}`}/>
        <svg className="ridge" viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true"><polygon fill={info.tint} points={info.ridge}/></svg>
      </a>
      <div className="card-row">
        <div className="swatches" role="group" aria-label="Farbe">
          {['creme', 'anthrazit'].map(c => (
            <button key={c} className="swatch" type="button" aria-pressed={c === color} onClick={() => pick(c)}><i style={{ background: SWATCH[c] }}></i>{COLOR_NAME[c]}</button>
          ))}
        </div>
        <span className="price num">{chf(product.price)}</span>
      </div>
      <div className="card-row">
        <span className="note">{info.wick}{info.lid ? ` · ${info.lid}` : ''}{info.outdoorOnly ? ' · nur draussen' : ''}</span>
        <div className="btns">
          <a className="btn btn-ghost" href={productUrl(product)}>Details</a>
          <button className="btn btn-ink" type="button" data-magnetic onClick={() => onAdd(product, imgRef.current)}>In den Warenkorb</button>
        </div>
      </div>
    </article>
  );
}

function Collection({ onAdd }) {
  const ref = useRefH(null);
  useInteractions(ref);
  return (
    <section className="section" id="kollektion" ref={ref}>
      <div className="wrap">
        <span className="kicker caps">Kollektion</span>
        <h2 className="sec-h">Zwei Grössen, zwei Farben</h2>
        <div className="cards">
          <CollectionCard model="saentis" onAdd={onAdd} delay="0"/>
          <CollectionCard model="eiger" onAdd={onAdd} delay=".1"/>
        </div>
      </div>
    </section>
  );
}

/* === Herstellung als Wanderweg === */
function Making() {
  const ref = useRefH(null);
  const steps = [
    ['Giessen', 'Jedes Gefäss giessen wir in Salmsach von Hand. Nach dem Aushärten wird es geprüft.'],
    ['Docht setzen', 'Säntis bekommt einen Glasfaserdocht, Eiger einen Holzfaserdocht.'],
    ['Füllen', 'Wir füllen jedes Gefäss mit Sojawachs, damit du es gleich anzünden kannst.'],
    ['Versand', 'Innerhalb der Schweiz ist das Paket meist nach rund 3 Werktagen bei dir.'],
  ];
  useMotion(ref, () => {
    WFMotion.gsap.from('.signs .sign', { rotate: -14, x: -30, opacity: 0, duration: 1.2, stagger: .14, ease: 'elastic.out(1, .55)', scrollTrigger: { trigger: '.signs', start: 'top 80%' } });
  });
  return (
    <section className="section trail" id="entstehung" ref={ref}>
      <div className="wrap">
        <span className="kicker caps" style={{ color: 'var(--sign)' }}>Herstellung</span>
        <h2 className="sec-h">So entsteht ein Wachsfresser</h2>
        <div className="signs">
          {steps.map(([t, d], i) => (
            <div className="sign-wrap" key={t}>
              <div className="post"><div className="sign"><b>{t}</b><span>Schritt {i + 1}</span></div></div>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* === Kleinserie, mit Foto === */
function Story() {
  const ref = useRefH(null);
  useMotion(ref, () => {
    const { gsap } = WFMotion;
    gsap.fromTo('.story .arch img', { yPercent: -6, scale: 1.15 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.story .arch', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  return (
    <section className="section" id="geschichte" ref={ref}>
      <div className="wrap story">
        <div className="arch" data-reveal=""><img src={IMG + 'saentis-indoor-scene.jpg'} alt="Ein brennender Säntis in Creme auf einem Holztisch" loading="lazy"/></div>
        <div data-reveal="" data-delay=".1">
          <span className="kicker caps">Kleinserie</span>
          <blockquote>Wir giessen jedes Gefäss einzeln. Darum sieht keines genau gleich aus wie das andere.</blockquote>
          <cite className="caps">Wachsfresser, Salmsach TG</cite>
        </div>
      </div>
    </section>
  );
}

/* === Abschluss als Nachtplakat === */
function NightCta() {
  const ref = useRefH(null);
  const starsRef = useRefH(null);
  useEffectH(() => {
    const stars = starsRef.current;
    for (let i = 0; i < 70; i++) {
      const s = document.createElement('i');
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 70 + '%';
      s.style.opacity = (.25 + Math.random() * .6).toFixed(2);
      stars.appendChild(s);
    }
    ref.current.querySelector('#nv').innerHTML = AlpenVessel.vesselMarkup('nv', { model: 'eiger', color: 'anthrazit' });
    const M = window.WFMotion;
    if (!M || !M.enabled) return undefined;
    const tws = AlpenVessel.live(ref.current.querySelector('#nv'), M.gsap);
    const ctx = M.gsap.context(() => {
      M.gsap.from('.night-art, .night h2, .night p, .night .btns', { y: 40, opacity: 0, duration: 1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: ref.current, start: 'top 75%' } });
    }, ref.current);
    return () => { ctx.revert(); tws.forEach(t => t.kill()); };
  }, []);
  useInteractions(ref);
  return (
    <section className="night" ref={ref}>
      <div className="stars" aria-hidden="true" ref={starsRef}></div>
      <div className="night-art" aria-hidden="true"><svg viewBox="-20 -40 460 500"><g id="nv"></g></svg></div>
      <h2>Jetzt <em>bestellen</em></h2>
      <p>Säntis kostet CHF 14.99, Eiger CHF 59.99. Innerhalb der Schweiz ist die Lieferung meist nach rund 3 Werktagen da.</p>
      <div className="btns">
        <a className="btn btn-sun" href="shop.html" data-magnetic>Zum Shop</a>
        <a className="btn btn-ghost" href="#prinzip">So funktioniert’s</a>
      </div>
    </section>
  );
}

function HomePage({ onAdd }) {
  const ref = useRefH(null);
  useEffectH(() => (window.WFMotion ? WFMotion.reveal(ref.current) : undefined), []);
  return (
    <main id="top" ref={ref}>
      <PosterHero onAdd={onAdd}/>
      <Postcards/>
      <Explainer/>
      <Collection onAdd={onAdd}/>
      <Making/>
      <Story/>
      <NightCta/>
    </main>
  );
}

window.HomePage = HomePage;
