/* alpen-vessel.js — Wachsfresser als flache Plakat-Illustration (SVG)
 * vesselMarkup(prefix, { model, color }) liefert das SVG-Innere im Koordinatenraum 0 0 420 460.
 * Der Fuss des Gefässes liegt bei y = 430, der Docht bei x = 200.
 */
(function () {
  const COLORS = {
    creme: { f1: '#f3ebdd', f2: '#d6c8b1', top: '#f8f2e7', well: '#c9bba3', wax: '#fbf3df' },
    anthrazit: { f1: '#7a7771', f2: '#53504c', top: '#8c8983', well: '#3f3d3a', wax: '#f6eedb' },
  };
  const FRONT = 'M76 188 H324 Q330 188 330 194 V400 Q330 430 300 430 H100 Q70 430 70 400 V194 Q70 188 76 188 Z';
  const TOP = 'M112 146 H288 Q298 146 304 154 L326 182 Q332 190 322 190 H78 Q68 190 74 182 L96 154 Q102 146 112 146 Z';
  const FLAME = 'M200 158 C170 150 166 114 200 54 C234 114 230 150 200 158 Z';
  const STUB_COLORS = ['#f4ece0', '#d9533f', '#8fb8a8', '#f2c14e', '#c9a3d8'];

  // Feste Poren, damit sich das Muster bei jedem Wechsel gleich anfühlt
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const PORES = Array.from({ length: 70 }, () => ({ x: 74 + rand() * 252, y: 194 + rand() * 232, r: .8 + rand() * 1.9, o: .1 + rand() * .16 }));

  function flame(p) {
    return `<g class="v-wind"><g class="v-flame">
      <path d="${FLAME}" fill="#e8843a"/>
      <path d="${FLAME}" fill="#f6c400" transform="translate(200 158) scale(.74) translate(-200 -158)"/>
      <path d="${FLAME}" fill="#fff6dc" transform="translate(200 158) scale(.42) translate(-200 -158)"/>
    </g></g>`;
  }

  function vesselMarkup(p, { model = 'saentis', color = 'creme' } = {}) {
    const C = COLORS[color] || COLORS.creme;
    const eiger = model === 'eiger';
    const pores = PORES.map(d => `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(2)}" fill="#1c1a17" opacity="${d.o.toFixed(2)}"/>`).join('');
    const well = eiger
      ? `<path class="v-well" d="M134 154 H266 L290 184 H110 Z" style="fill:${C.well}"/>
         <path class="v-wax" d="M138 160 H262 L284 183 H116 Z" style="fill:${C.wax}"/>`
      : `<ellipse class="v-well" cx="200" cy="168" rx="84" ry="14" style="fill:${C.well}"/>
         <ellipse class="v-wax" cx="200" cy="171" rx="78" ry="11" style="fill:${C.wax}"/>`;
    const wick = eiger
      ? `<rect x="184" y="156" width="32" height="13" rx="2" fill="#8a5a33"/><rect x="184" y="154" width="32" height="4" rx="2" fill="#3a2a1c"/>`
      : `<rect x="197" y="152" width="6" height="18" rx="3" fill="#f4f1ea"/><rect x="197" y="150" width="6" height="5" rx="2.5" fill="#2a221c"/>`;
    const lid = eiger
      ? `<g class="v-lid" transform="rotate(8 360 430)">
           <rect x="300" y="196" width="102" height="234" rx="18" fill="#5a3820"/>
           <rect x="312" y="196" width="90" height="234" rx="16" fill="url(#${p}-wood)"/>
           <path d="M330 214 V412 M352 206 V420 M376 214 V412" stroke="#4a2e18" stroke-opacity=".18" stroke-width="2" fill="none"/>
         </g>`
      : '';
    const blobs = STUB_COLORS.map((c, i) => `<ellipse class="v-blob" cx="${168 + i * 16}" cy="${171 + (i % 2) * 3}" rx="9" ry="3.6" fill="${c}" opacity="0"/>`).join('');
    return `
      <defs>
        <linearGradient id="${p}-front" x1="0" x2="1">
          <stop class="v-f1" offset="0" style="stop-color:${C.f1}"/>
          <stop class="v-f2" offset="1" style="stop-color:${C.f2}"/>
        </linearGradient>
        <linearGradient id="${p}-wood" x1="0" x2="1">
          <stop offset="0" stop-color="#7a4c2a"/><stop offset=".22" stop-color="#a77447"/><stop offset=".45" stop-color="#8a5a33"/>
          <stop offset=".62" stop-color="#c08b58"/><stop offset=".82" stop-color="#93613a"/><stop offset="1" stop-color="#6e4426"/>
        </linearGradient>
        <clipPath id="${p}-clip"><path d="${FRONT}"/></clipPath>
      </defs>
      <g class="v-halo">
        <circle cx="200" cy="110" r="200" fill="#f6c400" opacity=".07"/>
        <circle cx="200" cy="110" r="140" fill="#f6c400" opacity=".1"/>
        <circle cx="200" cy="110" r="84" fill="#f6c400" opacity=".16"/>
      </g>
      <ellipse class="v-shadow" cx="205" cy="432" rx="170" ry="13" fill="#1c2837" opacity=".3"/>
      ${lid}
      <g class="v-body">
        <path d="${FRONT}" fill="url(#${p}-front)"/>
        <g clip-path="url(#${p}-clip)">${pores}
          <path d="M70 188 H330 V230 Q200 214 70 230 Z" fill="#fff4dc" opacity=".14" class="v-lit"/>
        </g>
        <path class="v-top" d="${TOP}" style="fill:${C.top}" stroke="#1c2837" stroke-opacity=".14" stroke-width="2" stroke-linejoin="round"/>
        <path d="M74 190 H326" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>
        ${well}
        <g class="v-blobs">${blobs}</g>
        ${wick}
      </g>
      ${flame(p)}
      <g class="v-embers"></g>`;
  }

  function stubMarkup(i) {
    const c = STUB_COLORS[i % STUB_COLORS.length];
    const h = 34 + (i * 7) % 18;
    return `<g class="v-stub"><rect x="-11" y="${-h}" width="22" height="${h}" rx="4" fill="${c}"/>
      <rect x="-11" y="${-h}" width="22" height="5" rx="2.5" fill="#000" opacity=".08"/>
      <rect x="-1" y="${-h - 8}" width="2" height="9" rx="1" fill="#2a221c"/></g>`;
  }

  /* Flamme lebendig machen: Flackern, Lichtringe atmen, Glut steigt auf. Gibt die Tweens zurück. */
  function live(root, gsap, { halo = true } = {}) {
    const tws = [];
    const flame = root.querySelector('.v-flame');
    const ring = root.querySelector('.v-halo');
    const embers = root.querySelector('.v-embers');
    tws.push(gsap.to(flame, { scaleX: 'random(0.9, 1.07)', scaleY: 'random(0.9, 1.12)', duration: 'random(0.08, 0.22)', ease: 'sine.inOut', repeat: -1, repeatRefresh: true, transformOrigin: '50% 100%' }));
    if (halo) tws.push(gsap.to(ring, { scale: 1.06, opacity: .8, duration: 1.8, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 50%' }));
    embers.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const x0 = 200 + (Math.random() - .5) * 14;
      c.setAttribute('r', (1.4 + Math.random() * 1.8).toFixed(1));
      c.setAttribute('fill', i % 2 ? '#f6c400' : '#e8843a');
      c.setAttribute('cx', x0.toFixed(1));
      c.setAttribute('cy', '70');
      c.setAttribute('opacity', '0');
      embers.appendChild(c);
      tws.push(gsap.fromTo(c, { attr: { cx: x0, cy: 70 }, opacity: 1 },
        { attr: { cx: x0 + (Math.random() - .5) * 70, cy: -90 - Math.random() * 60 }, opacity: 0, duration: 2 + Math.random() * 1.6, ease: 'power1.out', repeat: -1, delay: Math.random() * 2.4 }));
    }
    return tws;
  }

  window.AlpenVessel = { COLORS, STUB_COLORS, vesselMarkup, stubMarkup, live };
})();
