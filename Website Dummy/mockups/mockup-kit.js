/* mockup-kit.js — gemeinsame Daten und Interaktionen für die Stil-Mockups
 * Nutzt motion.js (GSAP-Helfer) für Fly-to-Cart, Tilt, Magnet-Buttons.
 * Der Warenkorb ist hier nur ein Demo-Zähler.
 */
(function () {
  const IMG = '../assets/product/';
  const PRODUCTS = {
    'saentis-creme': { name: 'Säntis', color: 'Creme', price: 14.99, img: IMG + 'saentis-creme.jpg', wick: 'Glasfaserdocht', use: 'Kompaktes Format' },
    'saentis-anthrazit': { name: 'Säntis', color: 'Anthrazit', price: 14.99, img: IMG + 'saentis-anthrazit.jpg', wick: 'Glasfaserdocht', use: 'Kompaktes Format' },
    'eiger-creme': { name: 'Eiger', color: 'Creme', price: 59.99, img: IMG + 'eiger-creme.jpg', wick: 'Holzfaserdocht', use: 'Nur Aussenbereich' },
    'eiger-anthrazit': { name: 'Eiger', color: 'Anthrazit', price: 59.99, img: IMG + 'eiger-anthrazit.jpg', wick: 'Holzfaserdocht', use: 'Nur Aussenbereich' },
  };
  const chf = (v) => `CHF ${Number(v).toFixed(2)}`;

  let count = 0;
  function addToCart(id, sourceEl, qty = 1) {
    const M = window.WFMotion;
    const commit = () => {
      count += qty;
      document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; });
      toast(`${qty > 1 ? qty + ' × ' : ''}${PRODUCTS[id].name} · ${PRODUCTS[id].color} ${qty > 1 ? 'liegen' : 'liegt'} im Warenkorb`);
    };
    if (M && M.enabled && sourceEl) M.flyToCart(sourceEl).then(commit);
    else { commit(); if (M) M.bumpCart(); }
  }

  let toastTimer = null;
  function toast(text) {
    let el = document.querySelector('.mk-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'mk-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function wire(root = document) {
    const M = window.WFMotion;
    root.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.add;
        const scope = btn.closest('[data-product]') || document;
        const src = scope.querySelector('[data-fly]');
        const qtyEl = btn.dataset.qty ? document.querySelector(btn.dataset.qty) : null;
        addToCart(id, src, qtyEl ? Math.max(1, parseInt(qtyEl.textContent, 10) || 1) : 1);
        if (btn.dataset.done) {
          const old = btn.textContent;
          btn.textContent = btn.dataset.done;
          setTimeout(() => { btn.textContent = old; }, 1500);
        }
      });
    });
    if (!M) return;
    root.querySelectorAll('[data-tilt]').forEach(el => M.tilt(el, Number(el.dataset.tilt) || 6));
    root.querySelectorAll('[data-magnetic]').forEach(el => M.magnetic(el, 0.25));
    root.querySelectorAll('[data-marquee]').forEach(el => M.marquee(el));
  }

  /* Gestaffeltes Einblenden beim Scrollen */
  function reveals(selector = '[data-reveal]') {
    const M = window.WFMotion;
    if (!M || !M.enabled || !M.ScrollTrigger) return;
    M.gsap.utils.toArray(selector).forEach(el => {
      M.gsap.from(el, {
        y: Number(el.dataset.reveal) || 40,
        opacity: 0,
        duration: 1.1,
        ease: 'expo.out',
        delay: Number(el.dataset.delay) || 0,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });
  }

  // Rückweg zur Übersicht aller Stilstudien
  function backLink() {
    if (document.querySelector('.mk-back')) return;
    const a = document.createElement('a');
    a.className = 'mk-back';
    a.href = 'index.html';
    a.textContent = '← Alle Stile';
    Object.assign(a.style, {
      position: 'fixed', left: '16px', bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', zIndex: 55,
      padding: '8px 14px', borderRadius: '999px', background: 'rgba(20,20,20,.78)', color: '#fff',
      font: '500 13px/1.2 system-ui, sans-serif', textDecoration: 'none', backdropFilter: 'blur(6px)',
    });
    document.body.appendChild(a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', backLink);
  else backLink();

  window.MK = { PRODUCTS, chf, addToCart, toast, wire, reveals };
})();
