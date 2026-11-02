import './style.css';
import { initTray } from './tray.js';
import { waLink } from './data.js';
import Lenis from 'lenis';
import { initSecondHalf, gsap, ScrollTrigger } from './second-half.js';

const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Calm by default for people who ask the OS for less motion; ?motion=full opts back in (demo convenience).
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches && new URLSearchParams(location.search).get('motion') !== 'full';
document.documentElement.classList.toggle('still', reduced);

/* ---------- WhatsApp: every enquiry goes there ---------- */
$$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.waText); });

initTray();

/* ---------- smooth scroll (the second half's scrubbed chapters are built for it) ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    const t = a && a.getAttribute('href').length > 1 && document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    lenis.scrollTo(t, { duration: 1.4 });
  });
}
document.documentElement.classList.toggle('reduced', reduced);
initSecondHalf({ lenis, reduced });

/* ---------- loader: a short, small hello; the hero's entrance starts once it lifts ---------- */
{
  const loader = document.getElementById('loader');
  const bar = loader.querySelector('.loader__bar');
  const imgs = [...document.querySelectorAll('.hero img')]; // SVG <image> has no .complete; its file is the same as the cup's
  let done = 0;
  const step = () => bar.style.setProperty('--p', Math.min(1, (++done) / (imgs.length + 1)).toFixed(2));
  imgs.forEach((im) => (im.complete ? step() : im.addEventListener('load', step, { once: true })));
  const ready = Promise.all([
    document.fonts?.ready,
    ...imgs.map((im) => (im.complete ? null : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); }))),
    new Promise((r) => setTimeout(r, reduced ? 0 : 600)), // long enough to see the cup, short enough not to annoy
  ]);
  const finish = () => {
    if (loader.classList.contains('is-done')) return;
    bar.style.setProperty('--p', 1);
    setTimeout(() => {
      loader.classList.add('is-done');
      if (!reduced) document.documentElement.classList.add('motion'); // starts the hero's ink-in and photo drops
      ScrollTrigger.refresh();
    }, reduced ? 0 : 150);
  };
  ready.then(finish);
  setTimeout(finish, Math.max(0, 2500 - performance.now())); // never trap anyone: 2.5s after navigation at most
}
// tray drawer stops the page scrolling underneath it
new MutationObserver(() => { if (!lenis) return; document.querySelector('#tray').hidden ? lenis.start() : lenis.stop(); }).observe(document.querySelector('#tray'), { attributes: true, attributeFilter: ['hidden'] });

/* ---------- 2D, hand-drawn motion ----------
   "Line boil": the drawing is pushed through a little turbulence whose seed changes ~7 times a second,
   so the ink wobbles like frames of a hand-drawn cartoon. Paused off-screen and in hidden tabs. */
if (!reduced) {
  const turb = document.querySelector('#boil feTurbulence');
  const drawn = $$('[data-boil]');
  let seen = new Set(), seed = 1, last = 0;
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target))));
  drawn.forEach((el) => io.observe(el));
  const tick = (t) => {
    requestAnimationFrame(tick);
    if (!seen.size || document.hidden || t - last < 140) return;
    last = t;
    seed = (seed % 4) + 1; // a short loop of "frames", like an animator's cycle
    turb.setAttribute('seed', String(seed));
  };
  requestAnimationFrame(tick);
}
