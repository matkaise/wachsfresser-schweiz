/* motion.js — GSAP-Helfer für Interaktionen und Scroll-Animationen
 * Alles ist optional: fehlt GSAP oder wünscht der Browser reduzierte
 * Bewegung, fallen die Helfer auf statisches Verhalten zurück.
 */
(function () {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const enabled = !!gsap && !reduce;

  if (gsap && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (enabled) document.documentElement.classList.add('motion-on');

  const noop = () => {};

  /* Produktbild fliegt in den Warenkorb */
  function flyToCart(sourceEl) {
    const target = document.querySelector('.cart-btn');
    if (!enabled || !sourceEl || !target) {
      bumpCart();
      return Promise.resolve();
    }
    const from = sourceEl.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !to.width) {
      bumpCart();
      return Promise.resolve();
    }

    const ghost = document.createElement('div');
    ghost.className = 'fly-ghost';
    const src = sourceEl.currentSrc || sourceEl.src;
    if (src) ghost.style.backgroundImage = `url("${src}")`;
    Object.assign(ghost.style, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
    });
    document.body.appendChild(ghost);

    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const endScale = Math.max(0.06, 36 / Math.max(from.width, from.height));

    return new Promise((resolve) => {
      gsap.timeline({
        onComplete: () => {
          ghost.remove();
          resolve();
          requestAnimationFrame(bumpCart);
        },
      })
        .to(ghost, { scale: 0.82, borderRadius: 18, duration: 0.18, ease: 'power2.out' })
        .to(ghost, { x: dx, duration: 0.75, ease: 'power3.inOut' }, '>-0.02')
        .to(ghost, { y: dy, duration: 0.75, ease: 'back.in(1.4)' }, '<')
        .to(ghost, { scale: endScale, borderRadius: '50%', duration: 0.75, ease: 'power2.in' }, '<')
        .to(ghost, { opacity: 0.4, duration: 0.2 }, '>-0.2');
    });
  }

  function bumpCart() {
    const btn = document.querySelector('.cart-btn');
    if (!btn) return;
    btn.classList.remove('is-bumped');
    void btn.offsetWidth;
    btn.classList.add('is-bumped');
    if (!enabled) return;
    gsap.fromTo(btn, { scale: 1 }, { scale: 1.12, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' });
    const count = btn.querySelector('.cart-count');
    if (count) gsap.fromTo(count, { scale: 0.4, rotate: -30 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'elastic.out(1, 0.45)' });
  }

  /* Button folgt leicht dem Cursor */
  function magnetic(el, strength = 0.3) {
    if (!enabled || !finePointer || !el) return noop;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }

  /* Produktbild kippt räumlich mit Lichtreflex */
  function tilt(el, max = 7) {
    if (!enabled || !finePointer || !el) return noop;
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    gsap.set(el, { transformPerspective: 900, transformOrigin: 'center center' });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * max * 2);
      rx(-(py - 0.5) * max * 2);
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    };
    const leave = () => { rx(0); ry(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.set(el, { rotationX: 0, rotationY: 0 });
    };
  }

  /* Laufband, das auf Scroll-Tempo und -Richtung reagiert */
  function marquee(track) {
    if (!enabled || !track) return noop;
    track.classList.add('is-gsap');
    const tween = gsap.to(track, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 });
    // Vorlauf, damit das Band auch rückwärts laufen kann
    tween.totalTime(tween.duration() * 200);
    let st = null;
    if (ScrollTrigger) {
      st = ScrollTrigger.create({
        trigger: track,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate(self) {
          const v = self.getVelocity();
          const dir = self.direction;
          const boost = Math.min(6, 1 + Math.abs(v) / 260);
          gsap.to(tween, { timeScale: boost * dir, duration: 0.2, overwrite: true });
          gsap.to(tween, { timeScale: dir, duration: 1.4, delay: 0.25, ease: 'power2.out' });
        },
      });
    }
    return () => {
      tween.kill();
      if (st) st.kill();
      track.classList.remove('is-gsap');
      gsap.set(track, { clearProps: 'transform' });
    };
  }

  /* Scroll-Fortschritt als feine Linie unter der Navigation */
  function progressBar(el) {
    if (!gsap || !ScrollTrigger || !el) return noop;
    const t = gsap.fromTo(el, { scaleX: 0 }, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: reduce ? true : 0.3 },
    });
    return () => { if (t.scrollTrigger) t.scrollTrigger.kill(); t.kill(); };
  }

  /* gsap.context-Hilfe für React-Effekte */
  function scope(root, fn) {
    if (!enabled || !root) return noop;
    const ctx = gsap.context(fn, root);
    return () => ctx.revert();
  }

  function animateNumber(el, from, to, format) {
    if (!el) return;
    if (!enabled) { el.textContent = format(to); return; }
    const obj = { v: from };
    gsap.to(obj, {
      v: to,
      duration: 0.7,
      ease: 'power3.out',
      onUpdate: () => { el.textContent = format(obj.v); },
    });
  }

  function refresh() {
    if (ScrollTrigger) ScrollTrigger.refresh();
  }

  window.WFMotion = {
    gsap, ScrollTrigger, enabled, reduce, finePointer,
    flyToCart, bumpCart, magnetic, tilt, marquee, progressBar, scope, animateNumber, refresh,
  };
})();
