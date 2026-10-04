/* site-common.jsx — gemeinsame Bausteine: Modell-Infos, Navigation, Fuss und der Rahmen mit Warenkorb und Checkout */
const { useState: useStateS, useEffect: useEffectS, useRef: useRefS } = React;

const IMG = 'assets/product/';

/* Angaben pro Modell, die nicht in products.jsx stehen */
const MODEL_INFO = {
  saentis: {
    name: 'Säntis', altitude: '2502', kind: 'Wachsfresser klein', size: 'Klein',
    wick: 'Glasfaserdocht', lid: null, outdoorOnly: false, tint: '#f1d3a6',
    ridge: '0,80 0,50 60,30 110,45 170,10 220,40 290,25 350,48 400,35 400,80',
    scene: IMG + 'saentis-indoor-scene.jpg', sceneLabel: 'Säntis in Creme im Wohnzimmer',
    teaser: 'Der kleine Wachsfresser mit Glasfaserdocht.',
    gallery: {
      creme: [['saentis-creme.jpg', 'Säntis in Creme'], ['saentis-indoor-scene.jpg', 'Im Wohnzimmer'], ['saentis-anthrazit.jpg', 'Zum Vergleich: Anthrazit']],
      anthrazit: [['saentis-anthrazit.jpg', 'Säntis in Anthrazit'], ['saentis-indoor-scene.jpg', 'Im Wohnzimmer (Creme)'], ['saentis-creme.jpg', 'Zum Vergleich: Creme']],
    },
  },
  eiger: {
    name: 'Eiger', altitude: '3967', kind: 'Wachsfresser gross', size: 'Gross',
    wick: 'Holzfaserdocht', lid: 'Holzdeckel', outdoorOnly: true, tint: '#c7d6e4',
    ridge: '0,80 0,45 70,40 130,20 170,32 230,5 270,30 330,22 400,42 400,80',
    scene: IMG + 'eiger-dinner-scene.jpg', sceneLabel: 'Zwei Eiger beim Abendessen draussen',
    teaser: 'Der grosse Wachsfresser für Terrasse, Balkon und Garten. Mit Holzfaserdocht und Holzdeckel.',
    gallery: {
      creme: [['eiger-creme.jpg', 'Eiger in Creme'], ['eiger-creme-closed.jpg', 'Mit Holzdeckel'], ['eiger-dinner-scene.jpg', 'Beim Abendessen'], ['hero-outdoor-eiger.jpg', 'Auf dem Gartentisch']],
      anthrazit: [['eiger-anthrazit.jpg', 'Eiger in Anthrazit'], ['eiger-anthrazit-closed.jpg', 'Mit Holzdeckel'], ['eiger-dinner-scene.jpg', 'Beim Abendessen'], ['hero-outdoor-eiger.jpg', 'Auf dem Gartentisch']],
    },
  },
};

const SWATCH = { creme: '#e8e1d2', anthrazit: '#5c5a56' };
const COLOR_NAME = { creme: 'Creme', anthrazit: 'Anthrazit' };

const modelOf = (p) => (p.category === 'Eiger' ? 'eiger' : 'saentis');
const colorOf = (p) => (p.id.endsWith('anthrazit') ? 'anthrazit' : 'creme');
const findProduct = (model, color) => PRODUCTS.find(p => modelOf(p) === model && colorOf(p) === color);
const chf = (v) => `CHF ${Number(v).toFixed(2)}`;
const productUrl = (p) => `product.html?id=${p.id}`;

/* GSAP-Kontext an ein Element binden; räumt beim Verlassen auf */
function useMotion(ref, fn, deps = []) {
  useEffectS(() => {
    if (!window.WFMotion || !ref.current) return undefined;
    return WFMotion.scope(ref.current, fn);
  }, deps);
}

/* Magnet-Buttons und Tilt-Bilder innerhalb eines Bereichs aktivieren */
function useInteractions(ref, deps = []) {
  useEffectS(() => {
    const M = window.WFMotion;
    if (!M || !ref.current) return undefined;
    const offs = [
      ...[...ref.current.querySelectorAll('[data-magnetic]')].map(el => M.magnetic(el, .25)),
      ...[...ref.current.querySelectorAll('[data-tilt]')].map(el => M.tilt(el, Number(el.dataset.tilt) || 5)),
    ];
    return () => offs.forEach(off => off());
  }, deps);
}

/* Überschrift, deren Buchstaben einzeln animiert werden können */
function SplitTitle({ text, as: Tag = 'h1', ...rest }) {
  return (
    <Tag aria-label={text} {...rest}>
      {[...text].map((c, i) => <span className="ch" aria-hidden="true" key={i}>{c}</span>)}
    </Tag>
  );
}

function SiteNav({ current, cartCount, onCartOpen }) {
  const link = (href, label, key) => (
    <li><a href={href} aria-current={key === current ? 'page' : undefined}>{label}</a></li>
  );
  return (
    <header className="nav">
      <div className="wrap">
        <a className="brand" href="Wachsfresser.html">Wachsfresser</a>
        <ul className="nav-links caps">
          {link('Wachsfresser.html#prinzip', 'So funktioniert’s', 'prinzip')}
          {link('shop.html', 'Shop', 'shop')}
          {link('Wachsfresser.html#entstehung', 'Herstellung', 'entstehung')}
        </ul>
        <button className="cart-btn caps" type="button" onClick={onCartOpen} aria-label={`Warenkorb öffnen, ${cartCount} Artikel`}>
          Warenkorb <span className="cart-count num">{cartCount}</span>
        </button>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="foot caps">
      <div className="wrap">
        <span>Wachsfresser · Salmsach TG</span>
        <a href="mailto:hallo@wachsfresser-schweiz.ch">hallo@wachsfresser-schweiz.ch</a>
        <span>Impressum · Datenschutz · AGB</span>
      </div>
    </footer>
  );
}

/* Rahmen für alle Shop-Seiten: Navigation, Fuss, Warenkorb und Stripe-Checkout */
function ShopFrame({ current, render }) {
  const cart = useCart();
  const [cartOpen, setCartOpen] = useStateS(false);
  const [checkoutOpen, setCheckoutOpen] = useStateS(false);
  const onAdd = useAddToCart(cart, () => setCartOpen(true));

  const goCheckout = () => {
    setCartOpen(false);
    setTimeout(() => setCheckoutOpen(true), 200);
  };

  return (
    <>
      <SiteNav current={current} cartCount={cart.count} onCartOpen={() => setCartOpen(true)} />
      {render({ onAdd, overlayOpen: cartOpen || checkoutOpen })}
      <SiteFooter />
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart.items}
        onQty={cart.setQty}
        onCheckout={goCheckout}
      />
      <Checkout
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart.items}
        onComplete={() => cart.clear()}
      />
    </>
  );
}

Object.assign(window, {
  MODEL_INFO, SWATCH, COLOR_NAME, modelOf, colorOf, findProduct, chf, productUrl,
  useMotion, useInteractions, SplitTitle, SiteNav, SiteFooter, ShopFrame,
});
