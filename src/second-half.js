// The second half of the page: the Délice-style chapters from the earlier version, joined to the
// handmade first half by the "serve" bridge (the waitress's own plate becomes the counter's first plate).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { PRODUCTS } from './data.js';
import { initBlobs, initArcs } from './blobs.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = gsap.utils.clamp(0, 1);

/* ---------- serve: waitress → plate → the counter ----------
   0 … .45  zoom into the plate she carries until it sits where the counter's first plate will be
   .3 … .6  a real plate slides under the drawn one; the drawing lets go
   .45 … .8 the gold of plate No. 1 circle-wipes out from the centre
   .6 … 1   the tart lands on the plate and the arc title settles: identical to the counter's first frame */
// the plate inside the drawing, as a fraction of the drawing (from the trace crop: 525–880 × 790–965 in a 1060×2150 box at 520,380)
const PLATE = { cx: (702.5 - 520) / 1060, cy: (877.5 - 380) / 2150, w: 355 / 1060 };
function serve() {
  const pin = $('.serve__pin');
  const draw = $('.serve__drawing');
  const stage = $('.serve .bridge__stage');
  const wipe = $('.serve .bridge__wipe');
  const plate = $('.serve .plate--bridge');
  const tart = $('.serve__tart');
  const arc = $('.serve .arc--bridge');
  const line = $('.serve__line');
  const meta = $('.serve__meta');
  wipe.style.background = PRODUCTS[0].bg;
  const io = gsap.parseEase('power3.inOut'), sm = gsap.parseEase('power2.inOut');
  const lerp = gsap.utils.interpolate;

  function frame(p) {
    const W = pin.clientWidth, H = pin.clientHeight;
    const st = stage.getBoundingClientRect(), pr = pin.getBoundingClientRect();
    const target = { cx: st.left - pr.left + st.width / 2, cy: st.top - pr.top + st.height / 2, size: st.width * 1.02 };
    // start: the whole waitress standing in the frame
    // landscape: she stands right of the line; portrait: below it
    const portrait = W / H < 0.9;
    const h0 = H * (portrait ? 0.7 : 0.86), w0 = h0 * (1060 / 2150);
    const start = { w: w0, x: (portrait ? W * 0.5 : W * 0.68) - w0 * 0.46, y: H * (portrait ? 0.26 : 0.1) };
    // end: her plate scaled to the counter plate, centred on it
    const wEnd = target.size / PLATE.w;
    const end = { w: wEnd, x: target.cx - PLATE.cx * wEnd, y: target.cy - PLATE.cy * wEnd * (2150 / 1060) };
    const t = io(clamp(p / 0.45));
    const w = lerp(start.w, end.w, t);
    const x = lerp(start.x, end.x, t), y = lerp(start.y, end.y, t);
    // width, not scale: the SVG re-rasterises at every size, so the zoomed lines stay crisp
    gsap.set(draw, { x, y, width: w, opacity: 1 - clamp((p - 0.3) / 0.12) });
    // the drawn plate's footprint right now, relative to the counter plate's centre
    const dW = PLATE.w * w, dcx = x + PLATE.cx * w, dcy = y + PLATE.cy * w * (2150 / 1060);
    const k = gsap.parseEase('power2.out')(clamp((p - 0.3) / 0.15));
    const sx = dW / target.size;
    gsap.set(plate, { x: dcx - target.cx, y: dcy - target.cy, scaleX: sx, scaleY: sx * lerp(0.46, 1, k), opacity: clamp((p - 0.28) / 0.025) });
    gsap.set(line, { opacity: 1 - clamp(p / 0.18), y: -40 * clamp(p / 0.18) });
    gsap.set(wipe, { scale: sm(clamp((p - 0.45) / 0.35)) });
    gsap.set(tart, { opacity: clamp((p - 0.6) / 0.07), scale: lerp(1.2, 1, sm(clamp((p - 0.6) / 0.3))), rotation: lerp(-25, 0, sm(clamp((p - 0.6) / 0.3))) });
    gsap.set(meta, { opacity: clamp((p - 0.84) / 0.14), y: 20 * (1 - clamp((p - 0.84) / 0.14)), pointerEvents: p > 0.84 ? 'auto' : 'none' });
    const a = clamp((p - 0.7) / 0.25);
    gsap.set(arc, { opacity: a, rotation: -50 * (1 - a) });
  }
  const st = ScrollTrigger.create({ trigger: '#serve', start: 'top top', end: 'bottom bottom', onUpdate: (self) => frame(self.progress), onRefresh: (self) => frame(self.progress) });
  frame(0);
  addEventListener('resize', () => frame(st.progress));
}

/* ---------- counter: pinned plate carousel (Délice "promotions") ---------- */
function counter(lenis, reduced) {
  const sec = $('#counter');
  const sticky = $('[data-counter]');
  const track = $('[data-track]');
  const splashes = $('[data-splashes]');
  const n = PRODUCTS.length;
  track.innerHTML = PRODUCTS.map((p, i) => `
    <li class="item${i === 0 ? ' is-on' : ''}" data-item style="--bgc:${p.bg}">
      <span class="plate item__plate${p.render ? ' is-render' : ''}"><span class="plate__ring"></span><span class="plate__img"><img src="${p.plate}" alt="${p.alt}" loading="${i < 2 ? 'eager' : 'lazy'}"></span></span>
      <div class="item__meta">
        <h3 class="item__name">${p.name}</h3>
        <p class="item__note">${p.note}</p>
        <button class="item__add" type="button" data-add="${p.id}" aria-label="Add ${p.name} to your tray">Add to tray <span aria-hidden="true">+</span></button>
      </div>
    </li>`).join('');
  splashes.innerHTML = PRODUCTS.map((p) => `<span class="splash" style="background:${p.bg}"></span>`).join('');
  $('[data-counter-n]').textContent = String(n).padStart(2, '0');
  const items = $$('.item', track);
  const plates = $$('.item__plate', track);
  const spl = $$('.splash', splashes);
  const setH = () => { sec.style.height = `${innerHeight + (n - 1) * innerHeight * 0.8}px`; };
  setH();
  ScrollTrigger.addEventListener('refreshInit', setH);

  const xTo = gsap.quickTo(track, 'x', { duration: 0.55, ease: 'power3.out' });
  const rotTo = plates.map((pl) => gsap.quickTo(pl, 'rotation', { duration: 0.7, ease: 'power3.out' }));
  let index = 0, old = 0;
  const paint = (i) => {
    const p = PRODUCTS[i];
    sticky.style.setProperty('--ink', p.ink);
    sticky.style.setProperty('--bgc', p.bg);
    document.body.toggleAttribute('data-gold', p.bg === '#e8c47a');
    gsap.to(document.body, { '--fg': p.ink, duration: 0.5, overwrite: 'auto' });
    $('[data-counter-i]').textContent = String(i + 1).padStart(2, '0');
    items.forEach((el, k) => el.classList.toggle('is-on', k === i));
  };
  const swap = () => {
    gsap.set(spl, { zIndex: 0 });
    gsap.set(spl[old], { zIndex: 1 });
    gsap.set(spl[index], { zIndex: 2 });
    gsap.fromTo(spl[index], { scale: 0 }, { scale: 1, duration: 0.7, ease: 'power2.out', overwrite: true });
    paint(index);
  };
  paint(0);
  if (reduced) { sticky.style.opacity = ''; return; }

  const st = ScrollTrigger.create({
    trigger: sec, start: 'top top', end: 'bottom bottom',
    onUpdate(self) {
      const s = self.progress * (n - 1);
      const base = Math.min(Math.floor(s), n - 2);
      const f = s - base;
      const eased = base + gsap.parseEase('power2.inOut')(clamp((f - 0.25) / 0.5));
      const pitch = items[0].offsetWidth;
      xTo(-eased * pitch);
      // each plate swings as it passes the centre, never far enough to turn printed labels upside down
      rotTo.forEach((r, i) => r((i % 2 ? 1 : -1) * gsap.utils.clamp(-1, 1, eased - i) * (PRODUCTS[i].render ? 8 : 28)));
      index = Math.round(eased);
      if (index !== old) { swap(); old = index; }
    },
    onToggle(self) { if (self.isActive) paint(index); else document.body.removeAttribute('data-gold'); },
  });
  const show = (on) => { sticky.style.opacity = on ? '' : 0; sticky.style.pointerEvents = on ? '' : 'none'; };
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom top', onToggle: (self) => show(self.isActive || self.progress >= 1) });
  show(false);
  // keyboard users land here even before it pins: reveal and scroll to it
  sticky.addEventListener('focusin', () => { if (sticky.style.opacity === '0') { show(true); lenis ? lenis.scrollTo(sec, { duration: 0.8 }) : sec.scrollIntoView(); } });
  // first plate's text arrives as the bridge hands over
  // neighbours slide in once as the counter takes over; explicit end values + clearProps, so they can never be left invisible
  gsap.set(items.slice(1), { opacity: 0, x: 90 });
  ScrollTrigger.create({ trigger: sec, start: 'top top', once: true, onEnter: () => gsap.to(items.slice(1), { opacity: 1, x: 0, stagger: 0.06, duration: 0.9, ease: 'power3.out', clearProps: 'opacity,transform' }) });
  gsap.from('.counter__index, .counter__hint, .counter__doodle', { opacity: 0, y: 20, duration: 0.8, scrollTrigger: { trigger: sec, start: 'top top', toggleActions: 'play none none reverse' } });
  // keyboard: tabbing to an off-screen plate scrolls the carousel to it
  track.addEventListener('focusin', (e) => {
    const i = items.indexOf(e.target.closest('[data-item]'));
    if (i < 0 || i === index) return;
    const y = st.start + (st.end - st.start) * (i / (n - 1));
    lenis ? lenis.scrollTo(y, { duration: 0.8 }) : scrollTo(0, y);
  });
}

/* ---------- Délice effects: text / fade-up / zoom-out, grouped per block with a .1 stagger ---------- */
function effects() {
  const run = {
    text(el) {
      const sp = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
      return gsap.fromTo(sp.lines, { yPercent: 140, skewX: -5, rotate: 2.5 }, { yPercent: 0, skewX: 0, rotate: 0, duration: 1.6, ease: 'expo.out', stagger: 0.1, onStart: () => gsap.set(el, { autoAlpha: 1 }) });
    },
    'fade-up'(el) { return gsap.fromTo(el, { y: 56, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2, ease: 'expo.out', clearProps: 'transform' }); },
    'zoom-out'(el) { return gsap.timeline({ onStart: () => gsap.set(el, { autoAlpha: 1 }) }).fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'none' }).fromTo(el, { scale: 1.2 }, { scale: 1, duration: 1.2, ease: 'expo.out' }, '<'); },
  };
  const groups = new Map();
  $$('[data-fx]').forEach((el) => { const g = el.parentElement; groups.set(g, [...(groups.get(g) || []), el]); });
  groups.forEach((els, g) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: g, start: 'top 80%' } });
    els.forEach((el, i) => tl.add(run[el.dataset.fx](el), i === 0 ? 0 : '<0.1'));
  });
}

/* ---------- parallax: y from +speed to -speed px as the element crosses the viewport ---------- */
function parallax() {
  $$('[data-speed]').forEach((el, i) => {
    const sp = +el.dataset.speed;
    gsap.fromTo(el, { y: sp }, { y: -sp, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    if (el.classList.contains('floater')) gsap.fromTo(el, { rotate: -6 }, { rotate: 6 * (i % 2 ? 1 : -1), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // round photos pop in like plates set down on a table
  $$('.floater').forEach((el) => gsap.from(el.firstElementChild, { scale: 1.35, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
  gsap.fromTo('.arch__frame img', { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.arch', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.classic__wide img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.classic__gallery', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* ---------- marquee: constant drift + scroll acceleration, reverses with scroll direction ---------- */
function band(lenis) {
  const row = $('[data-marquee]');
  const inner = row.querySelector('.band__inner');
  inner.innerHTML += inner.innerHTML;
  let pos = 0, vel = 0, dir = 1;
  lenis?.on('scroll', (e) => { if (e.velocity) dir = e.direction === 1 ? 1 : -1; });
  const IO = new IntersectionObserver(([e]) => (row.dataset.on = e.isIntersecting ? '1' : ''));
  IO.observe(row);
  gsap.ticker.add((t, dt) => {
    if (!row.dataset.on) return;
    const target = 3 + Math.abs(lenis ? lenis.velocity : 0) * 0.6;
    vel += (target - vel) * 0.08;
    pos -= vel * dir * (dt / 16.7);
    const half = inner.scrollWidth / 2;
    if (pos <= -half) pos += half;
    if (pos > 0) pos -= half;
    inner.style.transform = `translate3d(${pos}px,0,0)`;
  });
}

/* ---------- badges: set down on the table, numbers count up ---------- */
function badges() {
  gsap.from('.badge', { scale: 0.4, rotate: -30, opacity: 0, stagger: 0.12, duration: 1.4, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.badges', start: 'top 70%' } });
  $$('.badge b').forEach((b) => {
    const to = +b.dataset.count; const o = { v: 0 };
    ScrollTrigger.create({ trigger: b, start: 'top 100%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: 'expo.out', onUpdate: () => { b.textContent = Math.round(o.v).toLocaleString('en-IN'); } }) });
  });
}

/* ---------- posts rail (real Instagram posts) ---------- */
const POSTS = [
  ['DcQwwSIMaEL', 'happiness-tray', 'If happiness was a tray, this would be it', 'Aug 2026'],
  ['DbYV614sY_s', 'raspberry-vanilla-tart', 'Our Raspberry Vanilla Tart, a classic', 'Jul 2026'],
  ['Da29GwEJRwE', 'almond-berry-croissant', 'Something new, something old, something sweet', 'Jul 2026'],
  ['DZfGQAaDOtY', 'bakers-moments', 'Came for the tiramisu and stayed for…', 'Jun 2026'],
  ['DZruq7yML_W', 'chocolate-orange', 'Orange, chocolate, and love', 'Jun 2026'],
  ['DaStCkWTv4t', 'reel-cake-process', 'The process is just as beautiful as the result', 'Jul 2026'],
  ['DZukUndsJqs', 'reel-golden-layers', 'Golden layers, gently baked with care', 'Jun 2026'],
  ['DcdLaryDFkn', 'views-berliners-tiramisu-eclairs', 'Different views but the same taste', 'Aug 2026'],
  ['Daxr5W8DMNj', 'vanilla-berry-cupcake', "Our Vanilla Berry Cupcake isn't like any other", 'Jul 2026'],
  ['DZXd0A8sw_D', 'reel-pastries-mood', 'Good day? Pastries. Bad day? Pastries.', 'Jun 2026'],
];
function posts(reduced) {
  const track = $('[data-ig]');
  track.innerHTML = POSTS.map(([id, img, cap, date]) => `<a class="ig__post" href="https://www.instagram.com/robertjuniorpatisserie/p/${id}/" target="_blank" rel="noopener"><span class="ig__img"><img src="img/${img}.webp" alt="" loading="lazy" width="320" height="320"></span><span class="ig__cap">${cap}</span><span class="ig__date"><span>${date}</span><span>View post ↗</span></span></a>`).join('');
  const rail = $('.ig');
  const bar = $('[data-rail-bar]');
  const upd = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const view = rail.clientWidth / rail.scrollWidth;
    gsap.set(bar, { scaleX: view, x: max ? (rail.scrollLeft / max) * (1 - view) * bar.parentElement.clientWidth : 0 });
  };
  rail.addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd); upd();
  let down = false, sx = 0, sl = 0, v = 0, lx = 0, moved = 0;
  rail.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = lx = e.clientX; sl = rail.scrollLeft; v = 0; gsap.killTweensOf(rail); });
  addEventListener('pointermove', (e) => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); if (moved > 4) rail.classList.add('is-drag'); v = e.clientX - lx; lx = e.clientX; rail.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; rail.classList.remove('is-drag'); gsap.to(rail, { scrollLeft: rail.scrollLeft - v * 18, duration: 1.2, ease: 'expo.out' }); });
  if (reduced) return;
  gsap.from('.ig__post', { y: 80, opacity: 0, rotate: (i) => (i % 2 ? 2 : -2), stagger: 0.07, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.ig', start: 'top 85%' } });
  // the whole row drifts sideways as the page scrolls (horizontal motion on vertical scroll)
  gsap.fromTo('.ig__track', { x: '6vw' }, { x: '-6vw', ease: 'none', scrollTrigger: { trigger: '.posts', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* ---------- CTA discs + footer stamp ---------- */
function discs() {
  $$('[data-spin]').forEach((el, i) => gsap.to(el, { rotation: i % 2 ? -360 : 360, duration: 40, ease: 'none', repeat: -1 }));
  $$('.ccard .arc').forEach((el, i) => gsap.fromTo(el, { rotation: -60 }, { rotation: 30, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));
  gsap.from('.ccard__disc', { scale: 0.5, rotate: -40, opacity: 0, stagger: 0.15, duration: 1.4, ease: 'back.out(1.4)', scrollTrigger: { trigger: '.cta__cards', start: 'top 75%' } });
  gsap.from('.ccard .btn', { y: 40, opacity: 0, stagger: 0.15, duration: 1.2, ease: 'expo.out', clearProps: 'transform', scrollTrigger: { trigger: '.cta__cards', start: 'top 60%' } });
  gsap.to('.seal__ring', { rotation: 360, duration: 30, ease: 'none', repeat: -1 });
  gsap.fromTo('.seal', { rotate: -90, scale: 0.6 }, { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 30%', scrub: true } });
}

/* ---------- came for / stayed for slots ---------- */
function slots() {
  $$('[data-slot]').forEach((slot, n) => {
    const words = slot.dataset.slot.split(',');
    slot.innerHTML = `<span class="slot__stack">${words.map((w) => `<span class="slot__w">${w}</span>`).join('')}</span>`;
    const stack = slot.firstChild;
    const items = [...stack.children];
    let i = 0, timer = null;
    const go = (k, instant) => {
      i = k;
      const d = instant ? 0 : 0.9;
      gsap.to(stack, { yPercent: (-100 / items.length) * i, duration: d, ease: 'expo.inOut' });
      gsap.to(slot, { width: items[i].offsetWidth, duration: d, ease: 'expo.inOut' });
    };
    go(0, true);
    addEventListener('resize', () => go(i, true));
    document.fonts?.ready.then(() => go(i, true));
    ScrollTrigger.create({
      trigger: '#stayed', start: 'top 75%', end: 'bottom 10%',
      onToggle: (self) => {
        clearInterval(timer);
        if (self.isActive) setTimeout(() => { timer = setInterval(() => go((i + 1) % items.length), 2200); }, n * 1100);
      },
    });
  });
  gsap.from('.posts__title > span', { opacity: 0, yPercent: 60, rotate: 2.5, skewX: -5, stagger: 0.1, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.posts__title', start: 'top 80%' } });
}


export function initSecondHalf({ lenis, reduced }) {
  initArcs();
  counter(lenis, reduced);
  posts(reduced);
  initBlobs({ lenis, reduced });
  if (reduced) return;
  document.documentElement.classList.add('fx-ready');
  serve();
  (document.fonts?.ready || Promise.resolve()).then(() => { effects(); ScrollTrigger.refresh(); });
  parallax();
  band(lenis);
  badges();
  slots();
  discs();
}

export { gsap, ScrollTrigger };
