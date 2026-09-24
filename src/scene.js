// One fixed WebGL canvas. The Blender pastries are "thrown" between a pose per section:
// scroll position picks two neighbouring poses, the render loop springs toward the blend.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const TAU = Math.PI * 2;
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Item list: source node in pastries.glb, normalised size (largest side = 1 world unit before pose scale)
const ITEMS = [
  { key: 'croissant', node: 'Croissant' },
  { key: 'rasp', node: 'Raspberry' },
  { key: 'blue', node: 'Blueberry' },
  { key: 'mac', node: 'Macaron' },
  { key: 'berl', node: 'Berliner' },
  { key: 'tart', node: 'Tart' },
  { key: 'rasp2', node: 'Raspberry' },
  { key: 'blue2', node: 'Blueberry' },
  { key: 'blue3', node: 'Blueberry' },
  { key: 'mac2', node: 'Macaron' },
];

// Poses: [x, y] in viewport halves (-1..1), z in world units, rotation (rad), s = scale.
// Anything omitted in a pose is "off" — thrown out past the camera along its own direction.
const P = (x, y, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => ({ x, y, z, rx, ry, rz, s });
const POSES = {
  hero: {
    croissant: P(0.42, 0.08, 0, 0.55, -0.5, 0.25, 2.3),
    rasp: P(0.8, 0.58, 0.5, 0.3, 0, 0.4, 0.62),
    blue: P(0.3, -0.35, 1, 0.4, 0.2, 0, 0.36),
    mac: P(0.9, -0.42, 0.4, 1.0, 0.3, -0.5, 1.0),
    berl: P(0.6, -0.62, 1.2, 0.5, 0, 0.2, 1.05),
    tart: P(0.08, 0.84, -3, 1.35, 0, 0.1, 1.3),
    rasp2: P(0.14, -0.92, -4, 0.2, 0, 1.2, 0.6),
    blue2: P(0.3, -0.9, 2, 0.3, 0, 0, 0.32),
    blue3: P(0.97, 0.12, -2, 0.2, 0, 0, 0.36),
    mac2: P(0.5, -0.98, -5, 1.2, 0.4, 0.8, 1.3),
  },
  seq: {},
  dough: {
    croissant: P(0.4, 0.0, 1, 0.35, 0.3, 0.15, 3.1),
    rasp: P(0.92, 0.78, -2, 0.3, 1, 0.2, 0.5),
    blue2: P(0.1, -0.85, -3, 0, 0, 0, 0.35),
  },
  doughEnd: {
    croissant: P(0.4, 0.0, 1, 1.1, TAU + 0.8, 0.5, 3.1),
    rasp: P(0.86, 0.7, -2, 1.6, 3, 0.2, 0.5),
    blue2: P(0.15, -0.8, -3, 2, 1, 0, 0.35),
  },
  numbers: {
    rasp: P(-0.9, 0.78, 0, 0.4, 0.6, 0.3, 0.55),
    blue: P(0.88, 0.82, -1, 0, 0, 0, 0.4),
    mac: P(0.92, -0.72, 0, 1.1, 0, -0.4, 0.9),
    berl: P(-0.9, -0.82, -1, 0.5, 0, 0.3, 0.8),
  },
  process: {
    rasp: P(1.25, -0.8, 1, 0.4, 0, 0, 0.5),
    mac: P(0.85, 0.85, -2, 1.2, 0, 0.3, 0.6),
  },
  processEnd: {
    rasp: P(-1.25, -0.8, 1, 0.4, 0, TAU * 1.5, 0.5),
    mac: P(-0.6, 0.85, -2, 1.2, TAU, 0.3, 0.6),
  },
  marquee: {
    berl: P(-0.35, 0.05, 2.2, 0.6, 1.2, 0.3, 1.2),
    mac: P(0.4, -0.05, 2.6, 1.3, 0.4, -0.3, 1.0),
    blue: P(0.05, 0.3, 3, 0, 0, 0, 0.4),
  },
  counter: {},
  views: {
    mac: P(-0.88, -0.78, 0.5, 1.2, 0.6, -0.3, 0.8),
    rasp: P(-0.62, 0.82, 0, 0.3, 0.8, 0.5, 0.5),
    blue3: P(-0.1, -0.92, 1, 0, 0, 0, 0.35),
  },
  stayed: {
    blue: P(0.93, 0.8, 0, 0, 0, 0, 0.4),
    rasp2: P(-0.93, 0.8, 0, 0.3, 0, 0.3, 0.5),
  },
  visitEnd: {
    croissant: P(-0.8, -0.68, 0.5, 0.9, 1.4, 0.2, 1.5),
    tart: P(0.8, -0.68, 0.5, 0.75, 1.5, 0, 1.25),
    berl: P(0.84, 0.62, -0.5, 0.5, 1.5, 0.2, 0.95),
    mac: P(-0.86, 0.6, -0.5, 1.1, 1.2, 0.4, 0.9),
    rasp: P(-0.55, 0.95, 0, 0.3, 2, 0.3, 0.5),
    rasp2: P(0.42, -0.96, 1.5, 0.3, 1, 1.2, 0.45),
    blue: P(0.97, -0.05, 1, 1, 0, 0, 0.38),
    blue2: P(-0.97, 0.0, 1, 1, 0, 0, 0.36),
    blue3: P(0.5, 0.95, -1, 0, 1, 0, 0.34),
    mac2: P(-0.5, -0.96, -1, 1.2, 1.4, 0.8, 0.8),
  },
  footer: {},
};
// rain start = each landing spot lifted above the viewport, pre-spun
// top pieces drop in from above, bottom pieces pop up from below — nothing crosses the headline
const rain = (end) => Object.fromEntries(Object.entries(end).map(([k, p], i) => [k, p && P(p.x, p.y + Math.sign(p.y || 1) * (2.3 + (i % 3) * 0.3), p.z, p.rx + 2.4, p.ry + 1.5, p.rz + 1.2 * (i % 2 ? 1 : -1), p.s)]));
POSES.visit = rain(POSES.visitEnd);

// Portrait screens: centre the dough croissant above the copy instead of beside it.
const PORTRAIT = {
  dough: { croissant: P(0.05, 0.42, 0, 0.45, 0.3, 0.15, 2.6), blue2: null },
  doughEnd: { croissant: P(0.05, 0.42, 0, 1.1, TAU + 0.8, 0.5, 2.6), blue2: null },
  visit: null,
  visitEnd: {
    croissant: P(-0.72, -0.84, 0.5, 0.9, 1.4, 0.2, 1.2), tart: P(0.72, -0.84, 0.5, 1.2, 1.5, 0, 1.0),
    berl: P(0.72, 0.84, -0.5, 0.5, 1.5, 0.2, 0.8), mac: P(-0.72, 0.84, -0.5, 1.1, 1.2, 0.4, 0.75),
    rasp: null, rasp2: P(0, -0.95, 1.5, 0.3, 1, 1.2, 0.4), blue: null, blue2: null, blue3: null, mac2: null,
  },
};
PORTRAIT.visit = rain(PORTRAIT.visitEnd);

export async function initScene({ canvas, onProgress, lenis }) {
  let portrait = innerWidth / innerHeight < 0.8;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.documentElement.classList.add('no-webgl');
    return null;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.4;
  const key = new THREE.DirectionalLight(0xffe2c4, 2.6); key.position.set(-4, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff8f86, 2.0); rim.position.set(5, 2, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x3a0a10, 0.55));

  // ---------- load models ----------
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await new Promise((res, rej) => loader.load('models/pastries.opt.glb', res, (e) => e.total && onProgress?.(e.loaded / e.total), rej));

  const tuned = new Map();
  const tune = (m, name) => {
    if (tuned.has(m)) return tuned.get(m);
    const n = name.toLowerCase();
    if (n.startsWith('flake')) { m.metalness = 1; m.roughness = 0.2; m.color.set(0xf2b544); m.side = THREE.DoubleSide; return m; } // gold leaf keeps its own PBR
    const phys = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, metalness: 0 });
    if (n.includes('rasp') || n.includes('berry') || n.includes('blue')) { phys.roughness = 0.3; phys.clearcoat = 0.8; phys.clearcoatRoughness = 0.25; }
    if (n.includes('cream')) { phys.roughness = 0.42; phys.sheen = 0.6; phys.sheenColor = new THREE.Color(0xfff4de); }
    if (n.includes('croissant')) { phys.roughness = 0.5; phys.clearcoat = 0.15; phys.clearcoatRoughness = 0.5; }
    if (n === 'tart' || (n.includes('berliner') && !n.includes('cream'))) phys.color.set(0xe0a060);
    if (n.includes('macaron')) { phys.roughness = 0.7; phys.sheen = 0.3; }
    tuned.set(m, phys);
    return phys;
  };

  // gold leaf was exported at its pre-fall height (animation start): settle each flake onto the cream
  const tartNode = gltf.scene.getObjectByName('Tart');
  tartNode?.children.filter((c) => c.name.startsWith('Flake')).forEach((c, i) => {
    const a = i * 2.39996, r = 0.12 + (i % 5) * 0.08;
    c.position.set(Math.cos(a) * r, 0.34 + (i % 3) * 0.07, Math.sin(a) * r);
    c.rotation.set((i % 4) * 0.4, a, (i % 3) * 0.3);
    c.scale.setScalar(0.75);
  });

  const sources = {};
  for (const it of ITEMS) {
    if (sources[it.node]) continue;
    const src = gltf.scene.getObjectByName(it.node);
    const box = new THREE.Box3().setFromObject(src);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    src.position.sub(center);
    src.traverse((o) => { if (o.isMesh) o.material = tune(o.material, (o.name || it.node).startsWith('Flake') || o.parent?.name?.startsWith('Flake') ? 'flake' : o.name || it.node); });
    const norm = 1 / Math.max(size.x, size.y, size.z);
    sources[it.node] = { src, norm };
  }

  // holder (pose) → spin (interaction) → model
  const items = ITEMS.map((it, i) => {
    const { src, norm } = sources[it.node];
    const model = i === ITEMS.findIndex((x) => x.node === it.node) ? src : src.clone();
    const holder = new THREE.Group();
    const spin = new THREE.Group();
    const wrap = new THREE.Group();
    wrap.scale.setScalar(norm);
    wrap.add(model);
    spin.add(wrap);
    holder.add(spin);
    scene.add(holder);
    const dir = new THREE.Vector3(Math.cos(i * 2.4), Math.sin(i * 2.4) * 0.8, 0).normalize();
    return {
      key: it.key, holder, spin, model,
      cur: { x: dir.x * 1.8, y: dir.y * 1.8, z: 6, rx: 0, ry: 0, rz: 0, s: 0.001 },
      off: P(dir.x * 1.7, dir.y * 1.6, 5.5, i, i * 0.7, i * 0.3, 0.5),
      av: new THREE.Vector3(), // angular velocity from flicks
      kick: new THREE.Vector3(), kickV: new THREE.Vector3(),
      phase: i * 1.37,
    };
  });
  const byKey = Object.fromEntries(items.map((i) => [i.key, i]));
  // the croissant "bakes" through the dough chapter: pale matte dough → glossy golden crust
  const croMats = [];
  byKey.croissant.model.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); croMats.push(o.material); } });
  const RAW = new THREE.Color(0xf3dcb4), BAKED = new THREE.Color(0xc98a3c), RAW_EM = new THREE.Color(0x4a3a26), BLACK = new THREE.Color(0x000000);
  let bakeShown = 1;

  // ---------- view metrics ----------
  let W = innerWidth, H = innerHeight, halfH = 1, halfW = 1;
  function resize() {
    W = innerWidth; H = innerHeight;
    portrait = W / H < 0.8;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = W / H < 0.8 ? 42 : 30;
    camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    halfW = halfH * camera.aspect;
    measure();
  }

  // ---------- scroll keys ----------
  let keys = [];
  const dough = { a: 0, b: 1 };
  let sleepAt = Infinity, asleep = false;
  function measure() {
    const vh = innerHeight;
    const top = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top + scrollY : 0; };
    const bottom = (sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().bottom + scrollY : 0; };
    keys = [
      { at: 0, pose: 'hero' },
      { at: top('#seq') + vh * 0.05, pose: 'seq' },
      ].sort((a, b) => a.at - b.at);
    dough.a = -1e9; dough.b = -1e9 + 1; // no dough chapter any more: the croissant stays baked
    sleepAt = top('#seq') + vh * 1.3;
  }

  const target = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 0 };
  function poseOf(name, it) {
    const o = portrait && PORTRAIT[name];
    const p = o && it.key in o ? o[it.key] : POSES[name][it.key];
    return p || it.off;
  }
  function blend(it, y) {
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].at <= y) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const t = b.at === a.at ? 0 : smooth(clamp((y - a.at) / (b.at - a.at), 0, 1));
    const pa = poseOf(a.pose, it), pb = poseOf(b.pose, it);
    for (const k of ['x', 'y', 'z', 'rx', 'ry', 'rz', 's']) target[k] = lerp(pa[k], pb[k], t);
    return target;
  }

  // ---------- input ----------
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / W) * 2 - 1;
    pointer.y = -(e.clientY / H) * 2 + 1;
  }, { passive: true });

  const ray = new THREE.Raycaster();
  function pick(clientX, clientY) {
    ray.setFromCamera({ x: (clientX / W) * 2 - 1, y: -(clientY / H) * 2 + 1 }, camera);
    const hit = ray.intersectObjects(items.map((i) => i.holder), true)[0];
    if (!hit) return null;
    return items.find((it) => { let o = hit.object; while (o) { if (o === it.holder) return true; o = o.parent; } return false; });
  }
  // flick: click a pastry in the hero or tray sections
  addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button, input, textarea, .rail, .compare, .tray, [data-drag-zone]')) return;
    if (game.on) return;
    const it = pick(e.clientX, e.clientY);
    if (!it) return;
    it.av.set((Math.random() - 0.5) * 18, 14 + Math.random() * 10, (Math.random() - 0.5) * 12);
    it.kickV.set((Math.random() - 0.5) * 3, 3.5, 2);
    document.dispatchEvent(new CustomEvent('pastry:flick'));
  });
  // hover cursor feedback
  let hoverT = 0;
  addEventListener('pointermove', (e) => {
    if (performance.now() - hoverT < 80) return; hoverT = performance.now();
    if (e.target.closest('a, button, input, .rail')) return;
    const it = pick(e.clientX, e.clientY);
    document.documentElement.classList.toggle('over-pastry', !!it);
  }, { passive: true });

  // drag to turn the croissant in the dough chapter
  const drag = { on: false, x: 0, y: 0, ry: 0, rx: 0, vry: 0 };
  const zone = document.querySelector('.dough__pin');
  zone?.setAttribute('data-drag-zone', '');
  zone?.addEventListener('pointerdown', (e) => { drag.on = true; drag.x = e.clientX; drag.y = e.clientY; zone.setPointerCapture(e.pointerId); });
  zone?.addEventListener('pointermove', (e) => {
    if (!drag.on) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.vry = dx * 0.012; drag.ry += dx * 0.012; drag.rx = clamp(drag.rx + dy * 0.008, -1, 1);
  });
  const endDrag = () => { drag.on = false; };
  zone?.addEventListener('pointerup', endDrag);
  zone?.addEventListener('pointercancel', endDrag);

  // ---------- footer game ----------
  const game = { on: false, score: 0, lives: 3, falling: [], plate: null, spawnT: 0, x: 0 };
  {
    const plate = new THREE.Group();
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.8, 0.12, 48), new THREE.MeshPhysicalMaterial({ color: 0xfbf5ea, roughness: 0.25, clearcoat: 1 }));
    const rimM = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.05, 12, 64), new THREE.MeshPhysicalMaterial({ color: 0x2a4b8d, roughness: 0.3, clearcoat: 1 }));
    rimM.rotation.x = Math.PI / 2; rimM.position.y = 0.06;
    plate.add(dish, rimM);
    plate.rotation.x = 0.35;
    plate.visible = false;
    scene.add(plate);
    game.plate = plate;
  }
  const scoreEl = document.querySelector('[data-score]');
  const livesEl = document.querySelector('[data-lives]');
  const playBtn = document.querySelector('[data-play]');
  const hintEl = document.querySelector('.game__hint');
  const drawLives = () => { livesEl.innerHTML = [0, 1, 2].map((i) => `<i class="${i >= game.lives ? 'is-lost' : ''}">♥</i>`).join(''); livesEl.setAttribute('aria-label', `${game.lives} lives left`); };
  function startGame() {
    game.on = true; game.score = 0; game.lives = 3; scoreEl.textContent = '0'; drawLives();
    hintEl.textContent = 'Move to steer the plate. Three drops and the kitchen closes.';
    game.plate.visible = true; game.plate.scale.setScalar(0.001);
    document.querySelector('.footer').classList.add('is-playing');
  }
  function stopGame() {
    if (!game.on) return;
    game.on = false; game.plate.visible = false;
    game.falling.forEach((f) => scene.remove(f.obj)); game.falling = [];
    document.querySelector('.footer').classList.remove('is-playing');
    playBtn.textContent = game.score ? `Play again · best tray ${Math.max(game.score, +(playBtn.dataset.best || 0))}` : 'Play: catch the pastries';
    playBtn.dataset.best = Math.max(game.score, +(playBtn.dataset.best || 0));
  }
  document.querySelector('[data-play]')?.addEventListener('click', startGame);
  const gameIO = new IntersectionObserver(([e]) => { if (!e.isIntersecting) stopGame(); }, { threshold: 0.2 });
  gameIO.observe(document.querySelector('#footer'));
  function spawn() {
    const pool = ['Raspberry', 'Blueberry', 'Macaron', 'Croissant', 'Berliner'];
    const node = pool[(Math.random() * pool.length) | 0];
    const { src, norm } = sources[node];
    const obj = new THREE.Group();
    const w = new THREE.Group(); w.scale.setScalar(norm * (node === 'Croissant' ? 1.2 : node === 'Blueberry' ? 0.45 : 0.75));
    w.add(src.clone()); obj.add(w);
    obj.position.set((Math.random() * 1.6 - 0.8) * halfW, halfH + 1, 0);
    scene.add(obj);
    game.falling.push({ obj, vy: 0, av: new THREE.Vector3(Math.random() * 3, Math.random() * 3, Math.random() * 3), caught: false, t: 0 });
  }

  // ---------- loop ----------
  let tPrev = performance.now(), time = 0;
  let raf = 0, visible = true, lastScroll = scrollY, vel = 0;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { tPrev = performance.now(); loop(); } });

  function loop() {
    if (!visible) return;
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - tPrev) / 1000, 0.05);
    tPrev = now; time += dt;
    const y = lenis ? lenis.animatedScroll : scrollY;
    // after the tart the 3D pastries are gone: stop drawing entirely (big win on phones)
    const sleep = y > sleepAt && !game.on;
    if (sleep !== asleep) { asleep = sleep; canvas.style.visibility = sleep ? 'hidden' : ''; }
    if (sleep) return;
    const v = lenis ? lenis.velocity : (y - lastScroll); lastScroll = y;
    vel = lerp(vel, v, 0.1);
    pointer.sx = lerp(pointer.sx, pointer.x, 0.06);
    pointer.sy = lerp(pointer.sy, pointer.y, 0.06);
    const k = 1 - Math.exp(-dt * 5.5); // spring toward pose → the "thrown" follow-through
    const scaleK = portrait ? 0.62 : 1;

    for (const it of items) {
      const t = blend(it, y);
      const c = it.cur;
      for (const p of ['x', 'y', 'z', 'rx', 'ry', 'rz', 's']) c[p] = lerp(c[p], t[p], k);
      // portrait: keep the hero cluster in the top half, clear of copy
      let px = c.x, py = c.y;
      if (portrait && y < innerHeight) { px *= 0.9; py = 0.6 + py * 0.32; }
      const depth = 1 + c.z * 0.08;
      it.holder.position.set(px * halfW + pointer.sx * 0.25 * depth, py * halfH + pointer.sy * 0.18 * depth + Math.sin(time * 0.9 + it.phase) * 0.08, c.z);
      it.holder.rotation.set(c.rx + pointer.sy * 0.15, c.ry + pointer.sx * 0.25, c.rz);
      it.holder.scale.setScalar(Math.max(0.0001, c.s * scaleK));

      // flick physics + scroll velocity spin
      it.av.multiplyScalar(Math.exp(-dt * 1.8));
      it.spin.rotation.x += (it.av.x + vel * 0.02) * dt;
      it.spin.rotation.y += (it.av.y + 0.12 + Math.abs(vel) * 0.01) * dt;
      it.spin.rotation.z += it.av.z * dt;
      it.kickV.addScaledVector(it.kick, -40 * dt).multiplyScalar(Math.exp(-dt * 5));
      it.kick.addScaledVector(it.kickV, dt);
      it.spin.position.copy(it.kick);
    }
    // bake level: raw on entering the dough chapter, golden by Day 03, baked everywhere else
    const inDough = y > dough.a - innerHeight && y < dough.b + innerHeight * 0.6;
    const bake = inDough ? clamp((y - dough.a) / (dough.b - dough.a), 0, 1) : 1;
    bakeShown = lerp(bakeShown, bake, k);
    for (const m of croMats) {
      m.color.copy(RAW).lerp(BAKED, bakeShown);
      m.emissive.copy(RAW_EM).lerp(BLACK, bakeShown);
      m.roughness = lerp(0.85, 0.5, bakeShown);
      m.clearcoat = lerp(0, 0.15, bakeShown);
    }
    byKey.croissant.spin.scale.setScalar(lerp(0.78, 1, bakeShown)); // proofing: it grows as it rises
    // dough: user drag on top of the scroll pose
    const cro = byKey.croissant;
    if (!drag.on) { drag.ry += drag.vry; drag.vry *= 0.94; drag.rx *= 0.96; }
    cro.spin.rotation.y += drag.vry * 0.2;
    cro.model.parent.rotation.y = drag.ry; // glTF is Y-up: spin around the pastry's own vertical
    cro.model.parent.rotation.x = drag.rx * 0.6;

    // game
    if (game.on) {
      game.plate.scale.setScalar(lerp(game.plate.scale.x, portrait ? 0.7 : 0.9, 0.12));
      game.x = lerp(game.x, pointer.x * halfW * 0.9, 0.2);
      game.plate.position.set(game.x, -halfH * 0.12, 0);
      game.spawnT -= dt;
      if (game.spawnT <= 0) { spawn(); game.spawnT = Math.max(0.45, 1.1 - game.score * 0.03); }
      for (const f of game.falling) {
        f.t += dt;
        if (!f.caught) {
          f.vy -= 6.5 * dt; f.obj.position.y += f.vy * dt;
          f.obj.rotation.x += f.av.x * dt; f.obj.rotation.y += f.av.y * dt;
          const py = game.plate.position.y + 0.25;
          if (Math.abs(f.obj.position.y - py) < 0.25 && Math.abs(f.obj.position.x - game.x) < 0.95 * game.plate.scale.x) {
            f.caught = true; f.t = 0; game.score++; scoreEl.textContent = String(game.score);
            scoreEl.animate([{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 350, easing: 'cubic-bezier(.2,.8,.2,1)' });
          }
        } else {
          f.obj.position.x = lerp(f.obj.position.x, game.x, 0.3);
          f.obj.position.y = game.plate.position.y + 0.3 + f.t * 2.2;
          f.obj.scale.setScalar(Math.max(0.001, 1 - f.t * 2.5));
        }
      }
      game.falling = game.falling.filter((f) => {
        const missed = !f.caught && f.obj.position.y < game.plate.position.y - 1.2;
        const dead = missed || (f.caught && f.t > 0.4);
        if (missed) { game.lives--; drawLives(); }
        if (dead) scene.remove(f.obj);
        return !dead;
      });
      if (game.lives <= 0) { hintEl.textContent = `Kitchen's closed. You caught ${game.score}.`; stopGame(); }
    }

    renderer.render(scene, camera);
  }

  addEventListener('resize', resize);
  resize();
  loop();

  return {
    measure,
    dispose() {
      cancelAnimationFrame(raf);
      gameIO.disconnect();
      removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
