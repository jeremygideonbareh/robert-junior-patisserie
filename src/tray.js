import { gsap } from 'gsap';
import { byId, IG_HANDLE } from './data.js';

const KEY = 'rj-tray-v1';
const state = new Map(); // id -> qty
let lenisRef = null;
let lastFocus = null;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    raw.forEach(([id, q]) => byId[id] && q > 0 && state.set(id, q));
  } catch { /* storage unavailable */ }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify([...state])); } catch { /* ignore */ }
}
const total = () => [...state.values()].reduce((a, b) => a + b, 0);

export function toast(msg) {
  const t = $('[data-toast]');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toast.tm);
  toast.tm = setTimeout(() => t.classList.remove('is-on'), 2600);
}

function render() {
  const n = total();
  $$('[data-tray-count]').forEach((el) => (el.textContent = n));
  const list = $('[data-tray-list]');
  list.innerHTML = '';
  for (const [id, q] of state) {
    const p = byId[id];
    const li = document.createElement('li');
    li.className = 'tline';
    li.innerHTML = `<img src="${p.img}" alt="" width="58" height="58"><p class="tline__name">${p.name}</p>
      <div class="tline__qty"><button type="button" data-dec="${id}" aria-label="One less ${p.name}">−</button><output aria-label="${p.name} quantity">${q}</output><button type="button" data-inc="${id}" aria-label="One more ${p.name}">+</button></div>`;
    list.append(li);
  }
  $('[data-tray-empty]').hidden = n > 0;
  $('[data-tray-form]').hidden = n === 0 || !$('[data-tray-done]').hidden;
  if (n === 0) $('[data-tray-done]').hidden = true;
  $$('[data-add]').forEach((b) => b.classList.toggle('is-added', state.has(b.dataset.add)));
}

function flyFrom(el, id) {
  const target = $('.nav__tray');
  if (!el || !target || document.documentElement.classList.contains('reduced')) return;
  const a = el.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const img = document.createElement('img');
  img.src = byId[id].img; img.className = 'fly'; img.alt = '';
  document.body.append(img);
  gsap.set(img, { x: a.left + a.width / 2 - 36, y: a.top + a.height / 2 - 36, scale: 0.4 });
  const tl = gsap.timeline({ onComplete: () => img.remove() });
  tl.to(img, { scale: 1.1, duration: 0.25, ease: 'back.out(3)' })
    .to(img, { x: b.left + b.width / 2 - 36, duration: 0.75, ease: 'power2.inOut' }, 0.15)
    .to(img, { y: b.top + b.height / 2 - 36, duration: 0.75, ease: 'back.in(1.4)' }, 0.15)
    .to(img, { scale: 0.2, opacity: 0, duration: 0.2 }, '-=0.12');
}

export function add(id, fromEl) {
  if (!byId[id]) return;
  state.set(id, (state.get(id) || 0) + 1);
  save(); render();
  flyFrom(fromEl, id);
  const btn = $('.nav__tray');
  setTimeout(() => { btn.classList.remove('is-bump'); void btn.offsetWidth; btn.classList.add('is-bump'); }, 800);
  toast(`${byId[id].name} is on your tray`);
}

function open() {
  const tray = $('#tray');
  lastFocus = document.activeElement;
  tray.hidden = false;
  lenisRef?.stop();
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.classList.add('tray-open');
  const mobile = matchMedia('(max-width: 900px)').matches;
  gsap.fromTo('.tray__scrim', { opacity: 0 }, { opacity: 1, duration: 0.4 });
  gsap.fromTo('.tray__panel', mobile ? { yPercent: 100 } : { xPercent: 100 }, { xPercent: 0, yPercent: 0, duration: 0.7, ease: 'expo.out' });
  gsap.fromTo('.tline, .tray__form > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.6, ease: 'power3.out', delay: 0.15 });
  setTimeout(() => $('.tray__x').focus(), 50);
}
function close() {
  const tray = $('#tray');
  if (tray.hidden) return;
  const mobile = matchMedia('(max-width: 900px)').matches;
  gsap.to('.tray__scrim', { opacity: 0, duration: 0.3 });
  gsap.to('.tray__panel', { ...(mobile ? { yPercent: 100 } : { xPercent: 100 }), duration: 0.45, ease: 'power3.in', onComplete: () => {
    tray.hidden = true;
    document.documentElement.style.overflow = '';
    document.documentElement.classList.remove('tray-open');
    lenisRef?.start();
    lastFocus?.focus?.();
  } });
}

function orderText(form) {
  const lines = [...state].map(([id, q]) => `• ${q} × ${byId[id].name}`);
  const d = new FormData(form);
  const when = d.get('when') ? new Date(d.get('when') + 'T12:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
  return [
    `Hi Robert Junior! I'd like to order:`,
    ...lines,
    ``,
    `Name: ${d.get('name')}`,
    `Pickup: ${when}`,
    d.get('note') ? `Note: ${d.get('note')}` : null,
    ``,
    `(sent from your website tray)`,
  ].filter((l) => l !== null).join('\n');
}

async function submit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const err = $('[data-tray-err]');
  let bad = null;
  for (const f of [form.elements.name, form.elements.when]) {
    const ok = f.value.trim() !== '';
    f.setAttribute('aria-invalid', String(!ok));
    if (!ok && !bad) bad = f;
  }
  if (bad) {
    err.textContent = bad === form.elements.name ? 'Add your name so we know who the tray is for.' : 'Pick a day for pickup.';
    bad.focus();
    return;
  }
  err.textContent = '';
  const text = orderText(form);
  const copied = await copy(text);
  // confirmation stays in the drawer: order text, open-DM link (a real user tap, so never popup-blocked), copy again
  $('[data-tray-order]').textContent = text;
  $('.tray__steps li b').textContent = copied ? 'copied' : 'below (copy it)';
  form.hidden = true;
  $('[data-tray-done]').hidden = false;
  gsap.fromTo('.tray__done > *', { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.6, ease: 'expo.out' });
  $('[data-ig-link]').focus();
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* clipboard blocked */ }
  return false;
}

export function initTray(lenis) {
  lenisRef = lenis;
  load();

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]');
    if (a) { add(a.dataset.add, a.closest('[data-item]')?.querySelector('img') || a); return; }
    if (e.target.closest('[data-open-tray]')) { e.preventDefault(); open(); return; }
    const c = e.target.closest('[data-close-tray]');
    if (c) { close(); if (c.tagName === 'A') { e.preventDefault(); setTimeout(() => lenisRef ? lenisRef.scrollTo('#counter') : document.querySelector('#counter').scrollIntoView(), 480); } return; }
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    if (inc || dec) {
      const id = (inc || dec).dataset.inc || (inc || dec).dataset.dec;
      const q = (state.get(id) || 0) + (inc ? 1 : -1);
      q > 0 ? state.set(id, q) : state.delete(id);
      save(); render();
      const next = $(`[data-${inc ? 'inc' : 'dec'}="${id}"]`) || $('.tray__x');
      next.focus();
    }
  });

  document.addEventListener('keydown', (e) => {
    const tray = $('#tray');
    if (tray.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // focus trap
      const f = $$('button, a, input, textarea', $('.tray__panel')).filter((x) => !x.closest('[hidden]') && x.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  const form = $('[data-tray-form]');
  form.addEventListener('submit', submit);
  $('[data-copy-again]').addEventListener('click', async () => {
    toast((await copy($('[data-tray-order]').textContent)) ? 'Copied again' : 'Select the text above to copy it');
  });
  $('[data-edit-tray]').addEventListener('click', () => { $('[data-tray-done]').hidden = true; form.hidden = false; form.elements.name.focus(); });
  form.elements.when.min = new Date().toISOString().slice(0, 10);

  render();
}
