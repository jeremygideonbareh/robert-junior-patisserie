import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { PRODUCTS } from './data.js';
import { initBlobs, initArcs } from './blobs.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = gsap.utils.clamp(0, 1);

/* ---------- odometer digits (loader + numbers) ---------- */
export function buildOdo(el, digits) {
  el.textContent = '';
  const cols = [];
  for (let i = 0; i < digits; i++) {
    const col = document.createElement('span');
    col.className = 'odo__col';
    const strip = document.createElement('span');
    strip.className = 'odo__strip';
    // two full turns + landing digit gives the rolling "slot" feel
    strip.innerHTML = Array.from({ length: 30 }, (_, k) => k % 10).join('<br>');
    col.append(strip);
    el.append(col);
    cols.push(strip);
  }
  return cols;
}

/* ---------- section colour + tab title (Palmo-style) ---------- */
function themes() {
  const secs = $$('[data-bg]');
  secs.forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (!self.isActive) return;
        const light = sec.dataset.bg.toLowerCase() === '#f3e8d6';
        gsap.to(document.body, { '--bg': sec.dataset.bg, '--fg': sec.dataset.fg, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
        document.body.dataset.theme = light ? 'light' : 'dark';
        $('meta[name="theme-color"]').content = sec.dataset.bg;
        if (sec.dataset.title) document.title = `Robert Junior | ${sec.dataset.title}`;
      },
    });
  });
}

/* ---------- heading reveals ---------- */
function headings() {
  $$('.split').forEach((el) => {
    SplitText.create(el, {
      type: 'lines,words',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.words, {
          yPercent: 115, rotate: 5, duration: 1.1, stagger: 0.045, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' },
        });
      },
    });
  });
  $$('.eyebrow:not(.hero__eyebrow):not(.seq__product .eyebrow)').forEach((el) => gsap.from(el, {
    opacity: 0, x: -24, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
  }));
}

/* ---------- hero ---------- */
let introDone = false;
export function heroIntro() {
  if (introDone || document.documentElement.classList.contains('reduced')) return;
  introDone = true;
  const title = $('.hero__title');
  const split = SplitText.create(title, { type: 'lines,chars', mask: 'lines', linesClass: 'split-line' });
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(split.chars, { yPercent: 120, rotate: 12, duration: 1.4, stagger: 0.035 })
    .from('.hero__eyebrow', { opacity: 0, y: 20, duration: 1 }, 0.2)
    .from('.hero__sub', { opacity: 0, y: 30, duration: 1.2 }, 0.45)
    .from('.hero__ctas > *', { opacity: 0, y: 30, stagger: 0.08, duration: 1.1 }, 0.6)
    .from('.nav__logo > *, .nav__links a', { autoAlpha: 0, y: -30, stagger: 0.06, duration: 1.1, clearProps: 'opacity,visibility,transform' }, 0.3)
    .from('.nav__tray', { autoAlpha: 0, scale: 0.6, duration: 1, ease: 'back.out(2)', clearProps: 'transform' }, 0.5)
    .from('.note', { opacity: 0, scale: 0.6, rotate: -8, stagger: 0.12, duration: 1, ease: 'back.out(2)' }, 0.9)
    .from('.hero__scroll, .hero__drag', { opacity: 0, duration: 1 }, 1.1);

  // hero exits upward with depth as the tart sequence takes over
  gsap.to('.hero__copy', {
    yPercent: -35, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__notes', {
    yPercent: -60, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '60% top', scrub: true },
  });
  return tl;
}

/* ---------- tart sequence → bridge ----------
   0 … .56  frames scrub (Blender render)
   .58 … .8 "Our signature" card
   .8 … 1   bridge: the tart leaves the render, lands on the first plate of the counter,
            while the first plate's colour circle-wipes in from the centre (Délice backsplash). */
function sequence(seq) {
  const pin = $('.seq__pin');
  const canvas = $('.seq__canvas');
  const steps = $$('.step');
  const meter = $('[data-seq-frame]');
  const cuts = [0, 0.22, 0.56, 0.72];
  const big = $$('.seq__big span');
  const fadeOut = $$('.seq__product, .seq__steps, .seq__big, .seq__meter');
  const tart = $('.bridge__tart');
  const wipe = $('.bridge__wipe');
  const plate = $('.plate--bridge');
  const arc = $('.arc--bridge');
  wipe.style.background = PRODUCTS[0].bg;
  const product = gsap.timeline({ paused: true })
    .from('.seq__product > *', { y: 50, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out' });
  let productOn = false, fgDark = false;
  const io = gsap.parseEase('power3.inOut'), out = gsap.parseEase('back.out(1.6)'), sm = gsap.parseEase('power2.inOut');
  const plateSize = () => $('.bridge__stage').offsetWidth;

  function bridge(bp) {
    // swap the canvas for the identical still the moment the bridge starts
    const live = bp > 0.001;
    canvas.style.opacity = live ? 0 : 1;
    tart.style.opacity = live ? 1 : 0;
    for (const el of fadeOut) { el.style.opacity = live ? 1 - clamp(bp / 0.22) : ''; el.style.translate = live ? `0 ${-40 * clamp(bp / 0.22)}px` : ''; }
    if (live && seq) {
      const r = seq.tartRect(); // canvas px
      const b = canvas.getBoundingClientRect();
      const k = b.width / canvas.clientWidth;
      const from = { cx: b.left + r.cx * k, cy: b.top + r.cy * k, size: r.size * k };
      const pr = $('.bridge__stage').getBoundingClientRect();
      const to = { cx: pr.left + pr.width / 2, cy: pr.top + pr.height / 2, size: plateSize() * 1.04 };
      const t = io(clamp((bp - 0.04) / 0.62));
      const size = gsap.utils.interpolate(from.size, to.size, t);
      gsap.set(tart, { x: gsap.utils.interpolate(from.cx, to.cx, t) - size / 2, y: gsap.utils.interpolate(from.cy, to.cy, t) - size / 2, width: size, rotation: -360 * t, transformOrigin: '50% 50%' });
    }
    gsap.set(wipe, { scale: sm(clamp((bp - 0.12) / 0.55)) });
    gsap.set(plate, { scale: out(clamp((bp - 0.42) / 0.36)) });
    const a = clamp((bp - 0.58) / 0.3);
    gsap.set(arc, { opacity: a, rotation: -50 * (1 - a) });
    const dark = bp > 0.45;
    if (dark !== fgDark) { fgDark = dark; gsap.to(document.body, { '--fg': dark ? PRODUCTS[0].ink : '#f3e8d6', duration: 0.5, overwrite: 'auto' }); }
  }

  ScrollTrigger.create({
    trigger: '#seq', start: 'top top', end: 'bottom bottom',
    onUpdate(self) {
      const p = self.progress;
      const fp = clamp(p / 0.56);
      seq?.setProgress(fp);
      meter.textContent = String(Math.round(fp * 95) + 1).padStart(2, '0');
      let s = 0; cuts.forEach((c, i) => { if (fp >= c) s = i; });
      steps.forEach((el, i) => el.classList.toggle('is-on', i === s));
      const on = p > 0.58;
      if (on !== productOn) { productOn = on; on ? product.play() : product.reverse(); pin.classList.toggle('is-product', on); }
      document.documentElement.classList.toggle('seq-product', on && p < 0.8 && self.isActive);
      bridge(clamp((p - 0.8) / 0.2));
    },
  });
  gsap.fromTo(big[0], { xPercent: -30 }, { xPercent: 20, ease: 'none', scrollTrigger: { trigger: '#seq', start: 'top bottom', end: '60% top', scrub: true } });
  gsap.fromTo(big[1], { xPercent: 30 }, { xPercent: -20, ease: 'none', scrollTrigger: { trigger: '#seq', start: 'top bottom', end: '60% top', scrub: true } });
  gsap.from('.seq__steps .step', { autoAlpha: 0, x: -40, stagger: 0.08, duration: 1, ease: 'expo.out', clearProps: 'opacity,visibility,transform', scrollTrigger: { trigger: '#seq', start: 'top 40%', toggleActions: 'play none none reverse' } });
}

/* ---------- counter: pinned plate carousel (Délice "promotions") ---------- */
function counter(lenis) {
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
        <button class="item__add magnetic" type="button" data-add="${p.id}" aria-label="Add ${p.name} to your tray" data-cursor="Add">Add to tray <span aria-hidden="true">+</span></button>
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

  const st = ScrollTrigger.create({
    trigger: sec, start: 'top top', end: 'bottom bottom',
    onUpdate(self) {
      const p = self.progress;
      const pitch = items[0].offsetWidth;
      xTo(-p * (n - 1) * pitch);
      rotTo.forEach((r, i) => r((i % 2 ? 1 : -1) * p * 180 * (n - 1) * (PRODUCTS[i].render ? 0.08 : 1)));
      index = Math.round(p * (n - 1));
      if (index !== old) { swap(); old = index; }
    },
    onToggle(self) { if (self.isActive) paint(index); },
    onRefresh(self) { sticky.style.visibility = self.progress > 0 || self.isActive ? '' : 'hidden'; },
  });
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom top', onToggle: (self) => { sticky.style.visibility = self.isActive || self.progress >= 1 ? '' : 'hidden'; } });
  sticky.style.visibility = 'hidden';
  // first plate's text arrives as the bridge hands over
  gsap.from(items[0].querySelectorAll('.item__meta > *'), { y: 30, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: sec, start: 'top top', toggleActions: 'play none none reverse' } });
  gsap.from('.counter__index, .counter__hint', { opacity: 0, y: 20, duration: 0.8, scrollTrigger: { trigger: sec, start: 'top top', toggleActions: 'play none none reverse' } });
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
  gsap.from('.floaters .floater', { scale: 0, stagger: 0.08, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.story', start: 'top 70%' } });
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
    ScrollTrigger.create({ trigger: b, start: 'top 85%', once: true, onEnter: () => gsap.to(o, { v: to, duration: 2, ease: 'expo.out', onUpdate: () => { b.textContent = Math.round(o.v).toLocaleString('en-IN'); } }) });
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
  track.innerHTML = POSTS.map(([id, img, cap, date]) => `<a class="ig__post" href="https://www.instagram.com/robertjuniorpatisserie/p/${id}/" target="_blank" rel="noopener" data-cursor="View"><span class="ig__img"><img src="img/${img}.webp" alt="" loading="lazy" width="320" height="320"></span><span class="ig__cap">${cap}</span><span class="ig__date"><span>${date}</span><span>View post ↗</span></span></a>`).join('');
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
  gsap.to('.stamp__ring', { rotation: 360, duration: 30, ease: 'none', repeat: -1 });
  gsap.fromTo('.stamp', { rotate: -90, scale: 0.6 }, { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 30%', scrub: true } });
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

/* ---------- nav, mobile bar ---------- */
function chrome(lenis) {
  const nav = $('#nav');
  const mbar = $('.mbar');
  let last = 0;
  const onScroll = (y) => {
    const down = y > last && y > innerHeight * 0.6;
    nav.classList.toggle('is-hidden', down && !$('#tray:not([hidden])'));
    mbar.classList.toggle('is-on', y > innerHeight * 0.8 && y < document.body.scrollHeight - innerHeight * 1.6);
    last = y;
  };
  lenis ? lenis.on('scroll', ({ scroll }) => onScroll(scroll)) : addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  // anchor links through Lenis
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-close-tray')) return;
    const t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) }) : t.scrollIntoView();
    if (a.getAttribute('href') === '#counter') setTimeout(() => $('[data-rail]').focus({ preventScroll: true }), 1700);
  });
}

/* ---------- cursor + magnetic ---------- */
function pointerFx() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  document.documentElement.classList.add('has-cursor');
  const c = $('.cursor');
  const label = $('[data-cursor-label]');
  const xTo = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    xTo(e.clientX); yTo(e.clientY);
    const t = e.target.closest?.('[data-cursor], [data-rail]');
    let text = t?.dataset.cursor || (t?.hasAttribute('data-rail') ? 'Drag' : '');
    if (!text && document.documentElement.classList.contains('over-pastry')) text = 'Flick';
    c.classList.toggle('is-big', !!text);
    label.textContent = text;
  }, { passive: true });

  $$('.magnetic').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.3);
      y((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* ---------- scroll progress ---------- */
function progress() {
  gsap.to('[data-progress]', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });
}

export function initMotion({ lenis, seq, reduced }) {
  initArcs();
  themes();
  chrome(lenis);
  counter(lenis);
  posts(reduced);
  initBlobs({ lenis, reduced });
  if (reduced) return;
  document.documentElement.classList.add('fx-ready');
  headings();
  progress();
  sequence(seq);
  // split text only once the display serif has loaded, or lines break in the wrong places
  (document.fonts?.ready || Promise.resolve()).then(() => { effects(); ScrollTrigger.refresh(); });
  parallax();
  band(lenis);
  badges();
  slots();
  discs();
  pointerFx();
}

export { ScrollTrigger, gsap };
