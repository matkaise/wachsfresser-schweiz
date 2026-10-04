/* alpen-data.js — Produktdetails, Galerien und gemeinsame Bausteine für Shop und Produktseite im Alpenplakat-Stil
 * Texte stammen aus products.jsx und der bestehenden Produktseite; nichts darüber hinaus behauptet.
 */
(function () {
  const IMG = '../assets/product/';
  const MODELS = {
    saentis: {
      name: 'Säntis', alt: '2502', kind: 'Wachsfresser kompakt', wick: 'Glasfaserdocht', lid: 'Ohne Deckel',
      tint: '#f1d3a6', ridge: '0,80 0,50 60,30 110,45 170,10 220,40 290,25 350,48 400,35 400,80',
      scene: IMG + 'saentis-indoor-scene.jpg', sceneAlt: 'Säntis in einer Wohnszene (Creme)',
      claim: 'Der kompakte Wachsfresser für ruhige Lichtmomente.',
    },
    eiger: {
      name: 'Eiger', alt: '3967', kind: 'Wachsfresser für draussen', wick: 'Holzfaserdocht', lid: 'Mit Holzdeckel',
      tint: '#c7d6e4', ridge: '0,80 0,45 70,40 130,20 170,32 230,5 270,30 330,22 400,42 400,80',
      scene: IMG + 'eiger-dinner-scene.jpg', sceneAlt: 'Eiger bei einem Abendessen im Freien',
      claim: 'Die schwere Aussenvariante für Terrasse, Balkon und Garten.',
      outdoorOnly: true,
    },
  };

  const DETAILS = {
    'saentis-creme': {
      long: 'Säntis ist der kompakte Wachsfresser für ruhige Lichtmomente. Das Betongefäss wird in Salmsach von Hand gegossen und ist bereits mit Glasfaserdocht und Sojawachs-Startfüllung vorbereitet. Danach kannst du geeignete Wachsreste nachlegen.',
      gallery: [['saentis-creme.jpg', 'Säntis in Creme'], ['saentis-indoor-scene.jpg', 'In Szene'], ['saentis-anthrazit.jpg', 'Zum Vergleich: Anthrazit']],
    },
    'saentis-anthrazit': {
      long: 'Säntis in Anthrazit verbindet ein kompaktes Betongefäss mit einem Glasfaserdocht. Jedes Stück wird von Hand gefertigt; leichte Farbabweichungen gehören zum Material.',
      gallery: [['saentis-anthrazit.jpg', 'Säntis in Anthrazit'], ['saentis-indoor-scene.jpg', 'In Szene (Creme)'], ['saentis-creme.jpg', 'Zum Vergleich: Creme']],
    },
    'eiger-creme': {
      long: 'Eiger ist die schwere Aussenvariante aus handgegossenem Beton. Er kommt mit Holzfaserdocht und Sojawachs-Startfüllung und ist für Terrasse, Balkon oder Garten gedacht. Diese Variante ist nicht für Innenräume vorgesehen.',
      gallery: [['eiger-creme.jpg', 'Eiger in Creme'], ['eiger-creme-closed.jpg', 'Mit Holzdeckel'], ['eiger-dinner-scene.jpg', 'Beim Abendessen'], ['hero-outdoor-eiger.jpg', 'Draussen am Tisch']],
    },
    'eiger-anthrazit': {
      long: 'Eiger in Anthrazit ist für den Aussenbereich konzipiert. Das Betongefäss wird in Salmsach gegossen, mit Holzfaserdocht vorbereitet und mit einer Sojawachs-Startfüllung ausgeliefert.',
      gallery: [['eiger-anthrazit.jpg', 'Eiger in Anthrazit'], ['eiger-anthrazit-closed.jpg', 'Mit Holzdeckel'], ['eiger-dinner-scene.jpg', 'Beim Abendessen'], ['hero-outdoor-eiger.jpg', 'Draussen am Tisch']],
    },
  };
  Object.values(DETAILS).forEach(d => { d.gallery = d.gallery.map(([f, label]) => ({ src: IMG + f, label })); });

  const SWATCH = { creme: '#e8e1d2', anthrazit: '#5c5a56' };

  /* Navigation und Fuss für alle Alpen-Seiten */
  function nav(current) {
    const link = (href, label, key) => `<li><a href="${href}"${key === current ? ' aria-current="page"' : ''}>${label}</a></li>`;
    return `<header class="nav"><div class="wrap">
      <a class="brand" href="alpen.html">Wachsfresser</a>
      <ul class="nav-links caps">
        ${link('alpen.html#prinzip', 'So funktioniert’s', 'prinzip')}
        ${link('alpen-shop.html', 'Shop', 'shop')}
        ${link('alpen.html#entstehung', 'Entstehung', 'entstehung')}
      </ul>
      <button class="cart-btn caps" type="button" aria-label="Warenkorb">Korb <span class="cart-count num">0</span></button>
    </div></header>`;
  }
  function footer() {
    return `<footer class="foot caps"><div class="wrap"><span>Wachsfresser · Salmsach TG</span><span>hallo@wachsfresser-schweiz.ch</span><span>Impressum · Datenschutz · AGB</span></div></footer>`;
  }

  function idParts(id) { const [model, color] = id.split('-'); return { model, color }; }

  window.ALPEN = { MODELS, DETAILS, SWATCH, nav, footer, idParts };
})();
