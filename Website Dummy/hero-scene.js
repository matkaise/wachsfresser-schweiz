/* hero-scene.js — Three.js-Bühne für den Hero
 * Prozedural modellierter Wachsfresser (Säntis / Eiger) aus Beton,
 * mit Shader-Flamme, warmem Flackerlicht, aufsteigender Glut und Staub.
 * Exponiert window.WFHeroScene.create(container, options) → Controller.
 */
import * as THREE from 'three';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLORS = {
  creme: 0xf6f0e4,
  anthrazit: 0x86837e,
};

const MODELS = {
  saentis: { size: 1.0, height: 0.94, corner: 0.2, well: 'round', wall: 0.14, rim: 0.1, wick: 'fiber', lid: false, scale: 0.95, offsetX: 0 },
  eiger: { size: 1.18, height: 1.0, corner: 0.18, well: 'square', wall: 0.1, rim: 0.13, wick: 'wood', lid: true, scale: 0.8, offsetX: -0.22 },
};

/* ---------- Texturen (Canvas, keine externen Assets) ---------- */

function concreteTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 236 + (Math.random() - 0.5) * 22;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // weiche Wolken für lebendigen Beton
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size, y = Math.random() * size, r = 30 + Math.random() * 90;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const tone = Math.random() > 0.5 ? '255,255,255' : '150,145,135';
    grd.addColorStop(0, `rgba(${tone},0.07)`);
    grd.addColorStop(1, `rgba(${tone},0)`);
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Poren (Lunker) wie bei echtem Guss
  for (let i = 0; i < 420; i++) {
    const x = Math.random() * size, y = Math.random() * size, r = Math.random() * 1.6 + 0.3;
    g.fillStyle = `rgba(70,64,56,${0.25 + Math.random() * 0.4})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.4, 1.4);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function woodTexture() {
  const w = 512, h = 512;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  // breite Farbbahnen wie beim Eichendeckel
  const bands = ['#6b4224', '#8a5a33', '#a77447', '#7a4c2a', '#c08b58', '#6e4426', '#93613a'];
  let y = 0;
  while (y < h) {
    const bh = 30 + Math.random() * 90;
    g.fillStyle = bands[Math.floor(Math.random() * bands.length)];
    g.fillRect(0, y, w, bh);
    y += bh;
  }
  // Maserung
  for (let i = 0; i < 260; i++) {
    const yy = Math.random() * h;
    const amp = 1 + Math.random() * 4;
    const freq = 0.004 + Math.random() * 0.01;
    g.strokeStyle = `rgba(${Math.random() > 0.5 ? '40,22,10' : '230,190,140'},${0.05 + Math.random() * 0.12})`;
    g.lineWidth = Math.random() * 1.6 + 0.4;
    g.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const py = yy + Math.sin(x * freq + i) * amp;
      if (x === 0) g.moveTo(x, py); else g.lineTo(x, py);
    }
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.1, 1.1);
  return tex;
}

function radialTexture(stops) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------- Geometrie ---------- */

function roundedRect(path, w, h, r) {
  const x = -w / 2, y = -h / 2;
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x + w, y + h - r);
  path.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  path.lineTo(x + r, y + h);
  path.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + r);
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return path;
}

function wellPath(path, cfg, inset) {
  const inner = cfg.size - cfg.wall * 2 - inset * 2;
  if (cfg.well === 'round') {
    path.absarc(0, 0, inner / 2, 0, Math.PI * 2, false);
  } else {
    roundedRect(path, inner, inner, Math.max(0.02, cfg.corner * 0.55 - inset));
  }
  return path;
}

function extrudeUp(shape, depth, bevel) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - (bevel ? bevel * 2 : 0),
    bevelEnabled: !!bevel,
    bevelThickness: bevel || 0,
    bevelSize: bevel || 0,
    bevelSegments: 5,
    curveSegments: 40,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, bevel || 0, 0);
  return geo;
}

/* ---------- Szene ---------- */

function create(container, options = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    container.classList.add('no-webgl');
    return null;
  }

  const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
  let dpr = maxDpr;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const camBase = new THREE.Vector3(0, 1.6, 5.5);
  const lookAt = new THREE.Vector3(0, 0.26, 0);
  camera.position.copy(camBase);

  /* Licht */
  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x20160f, 0.55));
  const key = new THREE.DirectionalLight(0xffe7cf, 1.15);
  key.position.set(-3, 4, 3.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffa860, 1.4);
  rim.position.set(3, 2.2, -3);
  scene.add(rim);
  const flameLight = new THREE.PointLight(0xff9a3c, 2.2, 0, 2);
  scene.add(flameLight);

  /* Materialien */
  const concreteMap = concreteTexture();
  const concrete = new THREE.MeshStandardMaterial({
    color: COLORS[options.color] || COLORS.creme,
    map: concreteMap,
    bumpMap: concreteMap,
    bumpScale: 0.6,
    roughness: 0.93,
    metalness: 0,
  });
  const wax = new THREE.MeshStandardMaterial({
    color: 0xf3e7cf,
    roughness: 0.45,
    emissive: 0xff8a2a,
    emissiveIntensity: 0.12,
  });
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.55 });
  const fiber = new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.8 });
  const char = new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 1 });

  /* Boden: Schatten + warmer Lichtteich */
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 3.2),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(0,0,0,0.75)'], [0.35, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']]),
      transparent: true, depthWrite: false,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;
  scene.add(shadow);

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshBasicMaterial({
      map: radialTexture([[0, 'rgba(255,170,90,0.55)'], [0.3, 'rgba(255,140,60,0.16)'], [1, 'rgba(255,120,40,0)']]),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.002;
  scene.add(pool);

  /* Wachsfresser-Gruppe */
  const pivot = new THREE.Group();
  scene.add(pivot);
  let vessel = null;
  const wickTip = new THREE.Object3D();

  function buildVessel(modelKey) {
    const cfg = MODELS[modelKey] || MODELS.saentis;
    const group = new THREE.Group();
    const bevel = 0.035;
    const outer = cfg.size - bevel * 2;

    // Wände mit Aussparung
    const shell = roundedRect(new THREE.Shape(), outer, outer, cfg.corner);
    shell.holes.push(wellPath(new THREE.Path(), cfg, -bevel));
    const body = new THREE.Mesh(extrudeUp(shell, cfg.height, bevel), concrete);
    group.add(body);

    // Wachs
    const waxTop = cfg.height - cfg.rim;
    const waxShape = wellPath(new THREE.Shape(), cfg, 0.003);
    const waxMesh = new THREE.Mesh(extrudeUp(waxShape, waxTop, 0), wax);
    group.add(waxMesh);

    // Docht
    let wickHeight;
    if (cfg.wick === 'wood') {
      wickHeight = 0.07;
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.11, wickHeight, 0.022), wood);
      w.position.y = waxTop + wickHeight / 2;
      group.add(w);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.112, 0.012, 0.024), char);
      top.position.y = waxTop + wickHeight;
      group.add(top);
    } else {
      wickHeight = 0.085;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, wickHeight, 14), fiber);
      w.position.y = waxTop + wickHeight / 2;
      group.add(w);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 0.018, 14), char);
      top.position.y = waxTop + wickHeight;
      group.add(top);
    }
    wickTip.position.set(0, waxTop + wickHeight + 0.005, 0);
    group.add(wickTip);

    // Holzdeckel (Eiger), angelehnt
    if (cfg.lid) {
      const lidSize = cfg.size * 0.98;
      const lidShape = roundedRect(new THREE.Shape(), lidSize - 0.04, lidSize - 0.04, cfg.corner);
      const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
        depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4, curveSegments: 24,
      });
      lidGeo.center();
      const lid = new THREE.Mesh(lidGeo, wood);
      lid.rotation.set(-0.02, -0.55, -0.16);
      lid.position.set(cfg.size / 2 + 0.26, lidSize / 2 - 0.02, 0.22);
      group.add(lid);
    }

    group.scale.setScalar(cfg.scale);
    group.userData = { cfg, waxTop };
    group.traverse(o => { if (o.isMesh) o.castShadow = false; });
    return group;
  }

  /* Flamme: Shader auf Billboard */
  const flameUniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 1 },
    uSway: { value: REDUCED ? 0.35 : 1 },
  };
  const flame = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.44),
    new THREE.ShaderMaterial({
      uniforms: flameUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform float uIntensity;
        uniform float uSway;
        varying vec2 vUv;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }

        void main() {
          float y = vUv.y;
          float x = vUv.x - 0.5;
          // Wiegen nimmt zur Spitze hin zu
          float sway = (noise(vec2(uTime * 1.7, y * 1.5)) - 0.5) * 0.22 * y * y * uSway;
          sway += sin(uTime * 2.3) * 0.015 * y * uSway;
          x -= sway;

          // Tropfenform: runder Fuss, schlanke Spitze
          float base = 0.22;
          float w;
          if (y < base) {
            float t = (base - y) / base;
            w = 0.36 * sqrt(max(0.0, 1.0 - t * t));
          } else {
            w = 0.36 * pow(max(0.0, 1.0 - (y - base) / (1.0 - base)), 1.15);
          }
          w *= 0.92 + noise(vec2(y * 6.0 - uTime * 4.0, 1.0)) * 0.16;

          float d = abs(x) / max(w, 0.0001);
          float alpha = 1.0 - smoothstep(0.35, 1.0, d);
          alpha *= smoothstep(0.0, 0.05, y);

          float core = 1.0 - smoothstep(0.0, 0.6, d);
          core *= smoothstep(0.05, 0.25, y) * (1.0 - smoothstep(0.55, 0.85, y));

          vec3 edge = vec3(1.0, 0.42, 0.08);
          vec3 mid = vec3(1.0, 0.72, 0.32);
          vec3 hot = vec3(1.0, 0.96, 0.84);
          vec3 col = mix(edge, mid, 1.0 - d);
          col = mix(col, hot, core);
          // Blauer Fuss
          float blue = (1.0 - smoothstep(0.02, 0.16, y)) * (1.0 - core);
          col = mix(col, vec3(0.25, 0.4, 1.0), blue * 0.7);

          alpha *= uIntensity;
          gl_FragColor = vec4(col * alpha * 1.4, alpha);
        }
      `,
    })
  );
  flame.renderOrder = 3;
  scene.add(flame);

  const glowTex = radialTexture([[0, 'rgba(255,214,150,1)'], [0.18, 'rgba(255,170,80,0.55)'], [0.5, 'rgba(255,120,40,0.12)'], [1, 'rgba(255,100,30,0)']]);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.85 }));
  glow.renderOrder = 2;
  scene.add(glow);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.22 }));
  halo.renderOrder = 1;
  scene.add(halo);

  /* Partikel: Glut & Staub */
  function particleSystem(count, color) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(count), 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uPixelRatio: { value: renderer.getPixelRatio() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aAlpha;
        attribute float aSize;
        uniform float uPixelRatio;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (6.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor * a * vAlpha, a * vAlpha);
        }
      `,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    return pts;
  }

  const EMBERS = REDUCED ? 0 : 36;
  const embers = particleSystem(Math.max(EMBERS, 1), 0xffa04a);
  const emberState = Array.from({ length: EMBERS }, () => ({ life: Math.random() * 3, max: 1, vx: 0, vz: 0, vy: 0, seed: Math.random() * 10 }));
  scene.add(embers);

  const DUST = REDUCED ? 30 : 90;
  const dust = particleSystem(DUST, 0xffd7a8);
  {
    const p = dust.geometry.attributes.position.array;
    const a = dust.geometry.attributes.aAlpha.array;
    const s = dust.geometry.attributes.aSize.array;
    for (let i = 0; i < DUST; i++) {
      p[i * 3] = (Math.random() - 0.5) * 7;
      p[i * 3 + 1] = Math.random() * 3.2;
      p[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;
      a[i] = 0.1 + Math.random() * 0.35;
      s[i] = 1 + Math.random() * 2.2;
    }
  }
  scene.add(dust);

  /* Zustand */
  const state = {
    model: MODELS[options.model] ? options.model : 'saentis',
    color: COLORS[options.color] ? options.color : 'creme',
    pointer: new THREE.Vector2(),
    pointerSmooth: new THREE.Vector2(),
    scroll: 0,
    scrollSmooth: 0,
    ignite: 1,
    swap: 1,
    running: false,
    visible: true,
    focusX: 0.5,
  };

  vessel = buildVessel(state.model);
  pivot.add(vessel);
  pivot.position.x = vessel.userData.cfg.offsetX;

  /* Grösse & Bildausschnitt */
  function resize() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    embers.material.uniforms.uPixelRatio.value = dust.material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    camera.aspect = w / h;
    const wide = w > 880;
    state.focusX = wide ? 0.68 : 0.5;
    if (state.focusX > 0.5) {
      const fullW = 2 * state.focusX * w;
      camera.setViewOffset(fullW, h, 0, 0, w, h);
    } else {
      camera.clearViewOffset();
    }
    camera.fov = wide ? 30 : 34;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* Interaktion */
  const onPointer = (e) => {
    const r = container.getBoundingClientRect();
    state.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };
  if (!REDUCED) window.addEventListener('pointermove', onPointer, { passive: true });

  /* Sichtbarkeit → Renderloop pausieren */
  const io = new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    updateLoop();
  }, { threshold: 0 });
  io.observe(container);
  const onVis = () => updateLoop();
  document.addEventListener('visibilitychange', onVis);

  function updateLoop() {
    const shouldRun = state.visible && !document.hidden;
    if (shouldRun && !state.running) {
      state.running = true;
      clock.getDelta();
      renderer.setAnimationLoop(tick);
    } else if (!shouldRun && state.running) {
      state.running = false;
      renderer.setAnimationLoop(null);
    }
  }

  const clock = new THREE.Clock();
  let t = 0;
  const tmp = new THREE.Vector3();

  // Adaptive Auflösung: auf schwachen Geräten Pixeldichte schrittweise senken
  let perfFrames = 0, perfTime = 0;
  function adaptQuality(rawDt) {
    perfFrames++;
    perfTime += rawDt;
    if (perfFrames < 45) return;
    const avg = perfTime / perfFrames;
    perfFrames = 0; perfTime = 0;
    if (avg > 0.024 && dpr > 0.75) {
      dpr = Math.max(0.75, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      resize();
    }
  }

  function tick() {
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    t += dt;
    if (rawDt < 0.5) adaptQuality(rawDt);

    state.pointerSmooth.lerp(state.pointer, 1 - Math.pow(0.0015, dt));
    state.scrollSmooth += (state.scroll - state.scrollSmooth) * (1 - Math.pow(0.002, dt));

    // Rotation: sanftes Pendeln + Maus + Scroll
    const idle = REDUCED ? 0 : Math.sin(t * 0.32) * 0.28;
    pivot.rotation.y = -0.62 + idle + state.pointerSmooth.x * 0.45 + state.scrollSmooth * 1.3;
    pivot.rotation.x = state.pointerSmooth.y * 0.06;
    pivot.position.y = -state.scrollSmooth * 0.35 + (REDUCED ? 0 : Math.sin(t * 0.9) * 0.008);
    const s = state.swap;
    pivot.scale.setScalar(Math.max(0.0001, s));

    camera.position.set(
      camBase.x + state.pointerSmooth.x * 0.12,
      camBase.y - state.pointerSmooth.y * 0.08 + state.scrollSmooth * 0.3,
      camBase.z - state.scrollSmooth * 0.6
    );
    camera.lookAt(lookAt);

    // Flackern: Mehrere Sinus + Zufall
    const flick = REDUCED
      ? 0.97 + Math.sin(t * 3) * 0.02
      : 0.88 + Math.sin(t * 9.1) * 0.05 + Math.sin(t * 23.7 + 1.3) * 0.035 + Math.sin(t * 3.3) * 0.04 + (Math.random() - 0.5) * 0.04;
    const ig = state.ignite * s;
    flameUniforms.uTime.value = t;
    flameUniforms.uIntensity.value = ig;

    pivot.updateMatrixWorld(true);
    wickTip.getWorldPosition(tmp);
    const vScale = vessel.userData.cfg.scale * s;
    const fh = 0.44 * vScale * (0.92 + flick * 0.12) * (0.4 + ig * 0.6);
    flame.scale.set(vScale * (0.95 + flick * 0.08), fh / 0.44, 1);
    flame.position.set(tmp.x, tmp.y + fh / 2 - 0.012 * vScale, tmp.z);
    flame.quaternion.copy(camera.quaternion);

    glow.position.set(tmp.x, tmp.y + fh * 0.4, tmp.z);
    glow.scale.setScalar(0.9 * vScale * flick * ig + 0.0001);
    halo.position.copy(glow.position);
    halo.scale.setScalar(3.6 * vScale * (0.9 + flick * 0.1) * ig + 0.0001);

    flameLight.position.set(tmp.x, tmp.y + 0.12 * vScale, tmp.z);
    flameLight.intensity = 2.4 * flick * ig;
    wax.emissiveIntensity = 0.1 + 0.08 * flick * ig;
    pool.material.opacity = 0.75 + flick * 0.25 * ig;
    pool.scale.setScalar(0.8 + 0.2 * ig);
    shadow.scale.setScalar(Math.max(0.0001, s) * vessel.userData.cfg.scale);
    shadow.position.x = pool.position.x = pivot.position.x;

    // Glut
    if (EMBERS) {
      const p = embers.geometry.attributes.position.array;
      const a = embers.geometry.attributes.aAlpha.array;
      const sz = embers.geometry.attributes.aSize.array;
      for (let i = 0; i < EMBERS; i++) {
        const e = emberState[i];
        e.life += dt;
        if (e.life > e.max) {
          e.life = 0;
          e.max = 1.6 + Math.random() * 2.4;
          e.vy = 0.18 + Math.random() * 0.35;
          e.vx = (Math.random() - 0.5) * 0.12;
          e.vz = (Math.random() - 0.5) * 0.12;
          p[i * 3] = tmp.x + (Math.random() - 0.5) * 0.04;
          p[i * 3 + 1] = tmp.y + fh * 0.8;
          p[i * 3 + 2] = tmp.z + (Math.random() - 0.5) * 0.04;
          sz[i] = 1 + Math.random() * 2.2;
        }
        const k = e.life / e.max;
        p[i * 3] += (e.vx + Math.sin(t * 1.3 + e.seed) * 0.06) * dt;
        p[i * 3 + 1] += e.vy * dt;
        p[i * 3 + 2] += e.vz * dt;
        a[i] = Math.sin(k * Math.PI) * (0.9 - k * 0.4) * ig * (Math.random() > 0.04 ? 1 : 0.3);
      }
      embers.geometry.attributes.position.needsUpdate = true;
      embers.geometry.attributes.aAlpha.needsUpdate = true;
      embers.geometry.attributes.aSize.needsUpdate = true;
    }

    // Staub schwebt langsam
    {
      const p = dust.geometry.attributes.position.array;
      for (let i = 0; i < DUST; i++) {
        p[i * 3 + 1] += dt * (0.02 + (i % 7) * 0.006);
        p[i * 3] += Math.sin(t * 0.2 + i) * dt * 0.02;
        if (p[i * 3 + 1] > 3.4) p[i * 3 + 1] = -0.2;
      }
      dust.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  updateLoop();
  // Ersten Frame sofort zeichnen, damit nichts aufblitzt
  tick();
  container.classList.add('is-ready');

  /* Übergänge */
  const gsap = window.gsap;

  function setColor(color) {
    if (!COLORS[color] || color === state.color) return;
    state.color = color;
    const target = new THREE.Color(COLORS[color]);
    if (gsap && !REDUCED) {
      gsap.to(concrete.color, { r: target.r, g: target.g, b: target.b, duration: 0.8, ease: 'power2.inOut' });
      // kleiner Dreh als Feedback
      gsap.fromTo(state, { swap: 0.96 }, { swap: 1, duration: 0.9, ease: 'elastic.out(1, 0.5)' });
    } else {
      concrete.color.copy(target);
    }
  }

  let swapTl = null;
  function setModel(model) {
    if (!MODELS[model] || model === state.model) return;
    state.model = model;
    const swapIn = () => {
      pivot.remove(vessel);
      vessel.traverse(o => { if (o.isMesh && o.geometry) o.geometry.dispose(); });
      vessel = buildVessel(model);
      pivot.add(vessel);
      pivot.position.x = vessel.userData.cfg.offsetX;
    };
    if (!gsap || REDUCED) { swapIn(); return; }
    if (swapTl) swapTl.kill();
    swapTl = gsap.timeline();
    swapTl
      .to(state, { ignite: 0, duration: 0.25, ease: 'power2.in' })
      .to(state, { swap: 0.001, duration: 0.4, ease: 'back.in(1.6)' }, '<0.05')
      .add(swapIn)
      .to(state, { swap: 1, duration: 0.9, ease: 'elastic.out(1, 0.6)' })
      .to(state, { ignite: 1, duration: 0.7, ease: 'power2.out' }, '-=0.45');
  }

  function intro() {
    if (!gsap || REDUCED) return;
    state.swap = 0.001;
    state.ignite = 0;
    gsap.timeline({ delay: 0.25 })
      .to(state, { swap: 1, duration: 1.4, ease: 'expo.out' })
      .to(state, { ignite: 1, duration: 1.1, ease: 'power2.out' }, '-=0.6');
  }

  return {
    setVariant({ model, color } = {}) {
      if (model) setModel(model);
      if (color) setColor(color);
    },
    setScroll(p) { state.scroll = Math.max(0, Math.min(1, p)); },
    intro,
    destroy() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      if (swapTl) swapTl.kill();
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      container.classList.remove('is-ready');
    },
  };
}

window.WFHeroScene = { create };
window.dispatchEvent(new Event('wf:scene-ready'));
