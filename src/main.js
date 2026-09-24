import './style.css';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, initMotion, heroIntro, buildOdo } from './motion.js';
import { initTray } from './tray.js';
import { createSequence } from './sequence.js';

const root = document.documentElement;
// Respect the OS setting, but let a visitor opt in (pill below, or ?motion=full) — remembered per browser.
const params = new URLSearchParams(location.search);
let optIn = params.get('motion') === 'full';
try { if (optIn) localStorage.setItem('rj-motion', 'full'); optIn = optIn || localStorage.getItem('rj-motion') === 'full'; } catch { /* storage blocked */ }
const osReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const reduced = osReduced && !optIn;
const portrait = () => innerWidth / innerHeight < 0.8;
if (reduced) root.classList.add('reduced');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

/* ---------- smooth scroll: Lenis is the only engine ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.3 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  window.__lenis = lenis; // used by tools/capture.mjs
}

initTray(lenis);

/* ---------- loader ---------- */
const loaderEl = document.getElementById('loader');
const odoCols = buildOdo(loaderEl.querySelector('[data-odo]'), 3);
loaderEl.querySelector('[data-odo]').insertAdjacentHTML('beforeend', '<span class="odo__pct">%</span>');
const statusEl = loaderEl.querySelector('[data-status]');
const stages = ['Laminating', 'Proofing', 'Baking', 'Piping', 'Plating'];
const shown = { v: 0 };
let real = 0;
const setOdo = (v) => {
  const n = Math.min(100, Math.round(v));
  const s = String(n).padStart(3, '0');
  // hundreds column only shows at 100, the rest roll continuously
  odoCols[0].style.transform = `translateY(${-(+s[0])}em)`;
  odoCols[1].style.transform = `translateY(${-(Math.floor(v / 10) % 10 + (v >= 100 ? 10 : 0))}em)`;
  odoCols[2].style.transform = `translateY(${-(v % 10) - (v >= 100 ? 10 : 0)}em)`;
  odoCols[0].parentElement.style.opacity = n >= 100 ? '1' : '0.25';
  statusEl.textContent = stages[Math.min(stages.length - 1, Math.floor(n / 21))];
  document.title = `Robert Junior | ${statusEl.textContent}`;
};
const odoTick = () => { shown.v += (real * 100 - shown.v) * 0.08; setOdo(shown.v); };
gsap.ticker.add(odoTick);

let pModel = 0, pFrames = 0;
const bump = () => { real = Math.max(real, pModel * 0.45 + pFrames * 0.55); };

/* ---------- 3D + sequence ---------- */
const seqCanvas = document.querySelector('[data-seq]');
const seq = reduced ? null : createSequence(seqCanvas);
const framesReady = seq
  ? new Promise((res) => {
      let early = false;
      seq.load((p) => { pFrames = Math.min(1, p / 0.35); bump(); if (p >= 0.35 && !early) { early = true; res(); } });
    })
  : Promise.resolve();

let scene = null;
const sceneReady = reduced
  ? Promise.resolve()
  : import('./scene.js')
      .then(({ initScene }) => initScene({ canvas: document.getElementById('gl'), lenis, portrait: portrait(), onProgress: (p) => { pModel = p; bump(); } }))
      .then((s) => { scene = s; pModel = 1; bump(); })
      .catch((e) => { console.warn('3D disabled:', e); root.classList.add('no-webgl'); pModel = 1; bump(); });

const minTime = new Promise((r) => setTimeout(r, reduced ? 0 : 1400));

initMotion({ lenis, seq, reduced });
ScrollTrigger.addEventListener('refresh', () => scene?.measure());
document.fonts?.ready.then(() => ScrollTrigger.refresh());

Promise.all([sceneReady, framesReady, minTime]).then(() => {
  real = 1;
  const out = gsap.timeline({ delay: 0.3, onComplete: () => { loaderEl.classList.add('is-gone'); gsap.ticker.remove(odoTick); document.title = 'Robert Junior | Laminating'; } });
  out.to(loaderEl.querySelectorAll('.loader__inner > *'), { yPercent: -60, opacity: 0, stagger: 0.06, duration: 0.7, ease: 'power3.in' })
    .to('.loader__curtain--top', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=0.15')
    .to('.loader__curtain--bot', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<')
    .add(() => {
      lenis?.start();
      ScrollTrigger.refresh();
      heroIntro();
    }, '-=0.75');
});

// safety: never trap the visitor behind the loader
setTimeout(() => { if (!loaderEl.classList.contains('is-gone')) { real = 1; loaderEl.classList.add('is-gone'); lenis?.start(); heroIntro(); } }, 12000);

if (reduced) {
  const pill = document.createElement('button');
  pill.type = 'button'; pill.className = 'motion-pill';
  pill.textContent = 'Reduced motion is on · Play full experience';
  pill.addEventListener('click', () => { try { localStorage.setItem('rj-motion', 'full'); } catch {} location.search = '?motion=full'; });
  document.body.append(pill);
  loaderEl.classList.add('is-gone');
  document.querySelectorAll('.roll').forEach((el) => (el.textContent = el.dataset.roll));
}
