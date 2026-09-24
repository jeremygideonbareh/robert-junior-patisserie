import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

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

/* ---------- tart sequence ---------- */
function sequence(seq) {
  const steps = $$('.step');
  const meter = $('[data-seq-frame]');
  const cuts = [0, 0.22, 0.56, 0.72]; // frame progress where each step begins (matches the Blender keyframes)
  const big = $$('.seq__big span');
  const product = gsap.timeline({ paused: true })
    .from('.seq__product > *', { y: 50, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out' });
  let productOn = false;

  ScrollTrigger.create({
    trigger: '#seq',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const p = self.progress;
      const fp = clamp(p / 0.82);
      seq?.setProgress(fp);
      const f = Math.round(fp * 95) + 1;
      meter.textContent = String(f).padStart(2, '0');
      let s = 0; cuts.forEach((c, i) => { if (fp >= c) s = i; });
      steps.forEach((el, i) => el.classList.toggle('is-on', i === s));
      if (p > 0.8 !== productOn) { productOn = p > 0.8; productOn ? product.play() : product.reverse(); $('.seq__pin').classList.toggle('is-product', productOn); }
      document.documentElement.classList.toggle('seq-product', productOn && self.isActive);
    },
    onToggle(self) { document.documentElement.classList.toggle('seq-product', productOn && self.isActive); },
  });
  gsap.fromTo(big[0], { xPercent: -30 }, { xPercent: 20, ease: 'none', scrollTrigger: { trigger: '#seq', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo(big[1], { xPercent: 30 }, { xPercent: -20, ease: 'none', scrollTrigger: { trigger: '#seq', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.seq__steps .step', { autoAlpha: 0, x: -40, stagger: 0.08, duration: 1, ease: 'expo.out', clearProps: 'opacity,visibility,transform', scrollTrigger: { trigger: '#seq', start: 'top 40%', toggleActions: 'play none none reverse' } });
}

/* ---------- dough days ---------- */
function dough() {
  const days = $$('.day');
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: { trigger: '#dough', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  });
  const splits = days.map((d) => SplitText.create(d.querySelector('.day__t'), { type: 'lines,words', mask: 'lines', linesClass: 'split-line' }));
  // first day builds in as the section arrives
  gsap.from(splits[0].words, { yPercent: 110, stagger: 0.06, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '#dough', start: 'top 60%', toggleActions: 'play none none reverse' } });
  days.forEach((d, i) => {
    if (i === 0) return;
    const prev = days[i - 1];
    const at = [0, 0.75, 1.6][i]; // handovers early in each third so every day holds for most of its stretch
    tl.to(splits[i - 1].words, { yPercent: -110, stagger: 0.02, duration: 0.22 }, at)
      .to(prev.querySelectorAll('.day__n, .day__p'), { opacity: 0, y: -20, duration: 0.2 }, at)
      .set(d, { opacity: 1 }, at + 0.12)
      .from(splits[i].words, { yPercent: 110, stagger: 0.03, duration: 0.25 }, at + 0.12)
      .from(d.querySelectorAll('.day__n, .day__p'), { opacity: 0, y: 24, duration: 0.25 }, '<0.05');
  });
  tl.to({}, { duration: 3.0 - tl.duration() > 0 ? 3.0 - tl.duration() : 0.01 });
  gsap.to('.dough__progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#dough', start: 'top top', end: 'bottom bottom', scrub: true } });
  gsap.from('.dough__caption', { opacity: 0, y: 20, scrollTrigger: { trigger: '#dough', start: 'top 20%', toggleActions: 'play none none reverse' } });
}

/* ---------- rolling numbers ---------- */
function numbers() {
  $$('.roll').forEach((el, idx) => {
    const target = String(el.dataset.roll);
    const strips = buildOdo(el, target.length);
    el.setAttribute('aria-label', target);
    gsap.set(strips, { yPercent: 0 });
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => strips.forEach((s, i) => {
        const d = +target[i];
        gsap.to(s, { y: `${-(20 + d)}em`, duration: 2.2 + i * 0.35, delay: idx * 0.12, ease: 'expo.out' });
      }),
    });
  });
  gsap.from('.numbers__grid li', { y: 60, opacity: 0, stagger: 0.1, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.numbers__grid', start: 'top 85%' } });
}

/* ---------- horizontal process ---------- */
function processScroll() {
  const sec = $('#process');
  const track = $('.process__track');
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const setH = () => { sec.style.height = `${dist() + innerHeight}px`; };
  setH();
  ScrollTrigger.addEventListener('refreshInit', setH);
  const horiz = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
  });
  $$('.panel').forEach((p) => {
    gsap.fromTo(p.querySelector('img'), { xPercent: -16 }, {
      xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: p, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true },
    });
    gsap.from(p.querySelector('.panel__media'), {
      clipPath: 'inset(20% 30% 20% 30% round 18px)', ease: 'none',
      scrollTrigger: { trigger: p, containerAnimation: horiz, start: 'left 100%', end: 'left 55%', scrub: true },
    });
    gsap.from(p.querySelector('figcaption'), {
      opacity: 0, y: 30, ease: 'none',
      scrollTrigger: { trigger: p, containerAnimation: horiz, start: 'left 80%', end: 'left 50%', scrub: true },
    });
  });
  return horiz;
}

/* ---------- velocity-reactive marquee ---------- */
function marquee(lenis) {
  const rows = $$('.marquee__row');
  const tweens = rows.map((row) => {
    const inner = row.querySelector('.marquee__inner');
    inner.innerHTML += inner.innerHTML; // seamless loop
    const dir = +row.dataset.dir;
    return gsap.fromTo(inner, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 26, ease: 'none', repeat: -1 });
  });
  let boost = 1;
  gsap.ticker.add(() => {
    const v = lenis ? lenis.velocity : 0;
    boost += ((1 + Math.min(Math.abs(v) * 0.35, 8)) * Math.sign(v || 1) - boost) * 0.08;
    tweens.forEach((t) => t.timeScale(boost));
  });
  gsap.fromTo('.marquee__row:first-child', { x: '10vw' }, { x: '-10vw', ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.marquee__row:last-child', { x: '-10vw' }, { x: '10vw', ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* ---------- counter rail ---------- */
function counterRail(reduced) {
  const rail = $('[data-rail]');
  const bar = $('[data-rail-bar]');
  const upd = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    const view = rail.clientWidth / rail.scrollWidth;
    gsap.set(bar, { scaleX: view, x: max ? (rail.scrollLeft / max) * (1 - view) * bar.parentElement.clientWidth : 0 });
  };
  rail.addEventListener('scroll', upd, { passive: true });
  addEventListener('resize', upd);
  upd();

  // drag with inertia
  let down = false, sx = 0, sl = 0, v = 0, lx = 0, moved = 0;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.target.closest('button')) return;
    down = true; moved = 0; sx = lx = e.clientX; sl = rail.scrollLeft; v = 0;
    gsap.killTweensOf(rail);
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 4) rail.classList.add('is-drag');
    v = e.clientX - lx; lx = e.clientX;
    rail.scrollLeft = sl - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false; rail.classList.remove('is-drag');
    gsap.to(rail, { scrollLeft: rail.scrollLeft - v * 18, duration: 1.2, ease: 'expo.out' });
  });
  // translate vertical wheel into sideways travel while hovering the rail
  rail.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const atEnd = (e.deltaY > 0 && rail.scrollLeft >= max - 2) || (e.deltaY < 0 && rail.scrollLeft <= 2);
    if (atEnd || !e.shiftKey) return; // keep page scroll natural; shift+wheel slides
    e.preventDefault();
    rail.scrollLeft += e.deltaY;
  }, { passive: false });

  if (reduced) return;
  ScrollTrigger.batch('.card', {
    start: 'top 92%',
    onEnter: (els) => gsap.fromTo(els, { y: 120, rotate: 5, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, stagger: 0.08, duration: 1.3, ease: 'expo.out', overwrite: true }),
  });
  // the whole rail drifts sideways as the section scrolls past — horizontal motion on vertical scroll
  gsap.fromTo('.rail__list', { x: '4vw' }, { x: '-4vw', ease: 'none', scrollTrigger: { trigger: '#counter', start: 'top bottom', end: 'bottom top', scrub: true } });
}

/* ---------- compare ---------- */
function compare() {
  const box = $('[data-compare]');
  const range = $('[data-compare-range]');
  const set = (v) => { box.style.setProperty('--pos', `${v}%`); range.value = v; };
  range.addEventListener('input', () => set(range.value));
  box.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = box.getBoundingClientRect();
    gsap.to(box, { '--pos': `${((e.clientX - r.left) / r.width) * 100}%`, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: () => { range.value = parseFloat(box.style.getPropertyValue('--pos')); } });
  });
  gsap.fromTo(box, { '--pos': '92%' }, { '--pos': '50%', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: box, start: 'top 70%' } });
  gsap.from(box, { clipPath: 'inset(12% 12% 12% 12% round 22px)', scale: 0.92, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'top 40%', scrub: true } });
  gsap.fromTo(box.querySelectorAll('.compare__img'), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
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
      trigger: '#stayed', start: 'top 70%', end: 'bottom 20%',
      onToggle: (self) => {
        clearInterval(timer);
        if (self.isActive) setTimeout(() => { timer = setInterval(() => go((i + 1) % items.length), 2200); }, n * 1100);
      },
    });
  });
  gsap.from('.stayed__line > span', { opacity: 0, y: 60, rotate: 3, stagger: 0.12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#stayed', start: 'top 70%', toggleActions: 'play none none reverse' } });
}

/* ---------- happiness tray ---------- */
function trayCta() {
  const split = SplitText.create('.tray-cta__title', { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '#visit', start: 'top 65%', end: 'top top', scrub: 0.8 } });
  tl.from(split.words, { yPercent: 120, rotate: 6, stagger: 0.08, ease: 'power3.out' })
    .from('.tray-cta__actions > *', { opacity: 0, scale: 0.85, stagger: 0.1 }, '>')
    .from('.visit > div', { y: 30, opacity: 0, stagger: 0.08 }, '>');
  gsap.to('.tray-cta__title', { scale: 0.9, opacity: 0.4, ease: 'none', scrollTrigger: { trigger: '#visit', start: 'bottom 160%', end: 'bottom top', scrub: true } });
}

/* ---------- footer ---------- */
function footer() {
  const split = SplitText.create('.footer__mark span', { type: 'chars' });
  gsap.from(split.chars, {
    yPercent: 100, rotate: 8, opacity: 0, stagger: 0.03, ease: 'none',
    scrollTrigger: { trigger: '#footer', start: 'top 80%', end: 'bottom bottom', scrub: 0.6 },
  });
  gsap.from('.game__score, .game__hint', { y: 40, opacity: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#footer', start: 'top 70%' } });
  // the play button is magnetic (x/y), so its entrance only uses scale
  gsap.from('.game__play', { scale: 0.6, opacity: 0, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: '#footer', start: 'top 70%' } });
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
    const t = e.target.closest?.('[data-cursor], .rail, [data-drag-zone], .compare');
    let text = t?.dataset.cursor || (t?.classList.contains('rail') ? 'Drag' : t?.hasAttribute('data-drag-zone') ? 'Turn' : t?.classList.contains('compare') ? 'Slide' : '');
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

/* ---------- instagram proof reel (real posts) ---------- */
const POSTS = [
  ['DcQwwSIMaEL', 'happiness-tray', 'If happiness was a tray, this would be it'],
  ['DbYV614sY_s', 'raspberry-vanilla-tart', 'Our Raspberry Vanilla Tart, a classic'],
  ['Da29GwEJRwE', 'almond-berry-croissant', 'Something new, something old, something sweet'],
  ['DZfGQAaDOtY', 'bakers-moments', 'Came for the tiramisu and stayed for…'],
  ['DZruq7yML_W', 'chocolate-orange', 'Orange, chocolate, and love'],
  ['DaStCkWTv4t', 'reel-cake-process', 'The process is just as beautiful as the result'],
  ['DZukUndsJqs', 'reel-golden-layers', 'Golden layers, gently baked with care'],
  ['DcdLaryDFkn', 'views-berliners-tiramisu-eclairs', 'Different views but the same taste'],
  ['DZXd0A8sw_D', 'reel-pastries-mood', 'Good day? Pastries. Bad day? Pastries.'],
  ['Daxr5W8DMNj', 'vanilla-berry-cupcake', "Our Vanilla Berry Cupcake isn't like any other"],
];
function igReel(lenis, reduced) {
  const track = $('[data-ig]');
  if (!track) return;
  const card = ([id, img, cap]) => `<a class="ig__post" href="https://www.instagram.com/robertjuniorpatisserie/p/${id}/" target="_blank" rel="noopener" data-cursor="View"><img src="img/${img}.webp" alt="" loading="lazy" width="320" height="320"><span><b>@robertjuniorpatisserie</b>${cap}</span></a>`;
  track.innerHTML = POSTS.map(card).join('') + (reduced ? '' : POSTS.map(card).join('').replaceAll('<a ', '<a tabindex="-1" aria-hidden="true" '));
  track.querySelectorAll('a').forEach((a, i) => { if (i < POSTS.length) a.setAttribute('aria-label', `Instagram post: ${POSTS[i][2]}`); });
  if (reduced) return;
  const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
  track.addEventListener('pointerenter', () => gsap.to(loop, { timeScale: 0.15, duration: 0.6 }));
  track.addEventListener('pointerleave', () => gsap.to(loop, { timeScale: 1, duration: 0.6 }));
  track.addEventListener('focusin', () => loop.pause());
  track.addEventListener('focusout', () => loop.resume());
  ScrollTrigger.create({ trigger: '.ig', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? loop.resume() : loop.pause()) });
  gsap.from('.ig__post', { y: 80, rotate: (i) => (i % 2 ? 4 : -4), opacity: 0, stagger: 0.05, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ig', start: 'top 90%' } });
}

/* ---------- how-it-works steps ---------- */
function how() {
  gsap.from('.how li', { y: 24, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.how', start: 'top 90%', toggleActions: 'play none none reverse' } });
  gsap.from('.how b', { scale: 0, rotate: -90, stagger: 0.12, duration: 0.9, ease: 'back.out(2.5)', scrollTrigger: { trigger: '.how', start: 'top 90%', toggleActions: 'play none none reverse' } });
}

export function initMotion({ lenis, seq, reduced }) {
  themes();
  igReel(lenis, reduced);
  chrome(lenis);
  counterRail(reduced);
  if (reduced) {
    const r = $('[data-compare-range]');
    r.addEventListener('input', () => $('[data-compare]').style.setProperty('--pos', `${r.value}%`));
    return;
  }
  headings();
  progress();
  how();
  sequence(seq);
  dough();
  numbers();
  processScroll();
  marquee(lenis);
  compare();
  slots();
  trayCta();
  footer();
  pointerFx();
}

export { ScrollTrigger, gsap };
