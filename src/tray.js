import { byId, waLink } from './data.js';

const KEY = 'rj-tray-v1';
const state = new Map(); // id -> qty
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
  $$('[data-add]').forEach((b) => {
    const on = state.has(b.dataset.add);
    b.classList.toggle('is-added', on);
    b.innerHTML = on ? `On tray · ${state.get(b.dataset.add)} <span aria-hidden="true">+</span>` : 'Add to tray <span aria-hidden="true">+</span>';
  });
}

export function add(id) {
  if (!byId[id]) return;
  state.set(id, (state.get(id) || 0) + 1);
  save(); render();
  const btn = $('.nav__tray');
  btn.classList.remove('is-bump'); void btn.offsetWidth; btn.classList.add('is-bump');
  toast(`${byId[id].name} is on your tray`);
}

function open() {
  lastFocus = document.activeElement;
  $('[data-toast]').classList.remove('is-on'); // the tray itself shows what was added
  $('#tray').hidden = false;
  document.documentElement.style.overflow = 'hidden';
  setTimeout(() => $('.tray__x').focus(), 50);
}
function close() {
  const tray = $('#tray');
  if (tray.hidden) return;
  tray.hidden = true;
  document.documentElement.style.overflow = '';
  lastFocus?.focus?.();
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
  ].filter((l) => l !== null).join('\n');
}

function submit(e) {
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
  const url = waLink(orderText(form));
  // opened straight from the submit (a real tap), so browsers don't block it
  window.open(url, '_blank', 'noopener');
  $('[data-wa-order]').href = url;
  form.hidden = true;
  $('[data-tray-done]').hidden = false;
  $('[data-wa-order]').focus();
}

export function initTray() {
  load();

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]');
    if (a) { add(a.dataset.add); return; }
    if (e.target.closest('[data-open-tray]')) { e.preventDefault(); open(); return; }
    const c = e.target.closest('[data-close-tray]');
    if (c) { close(); return; }
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    if (inc || dec) {
      const id = (inc || dec).dataset.inc || (inc || dec).dataset.dec;
      const q = (state.get(id) || 0) + (inc ? 1 : -1);
      q > 0 ? state.set(id, q) : state.delete(id);
      save(); render();
      ($(`[data-${inc ? 'inc' : 'dec'}="${id}"]`) || $('.tray__x')).focus();
    }
  });

  document.addEventListener('keydown', (e) => {
    const tray = $('#tray');
    if (tray.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // keep focus inside the tray
      const f = $$('button, a, input, textarea', $('.tray__panel')).filter((x) => !x.closest('[hidden]') && x.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  const form = $('[data-tray-form]');
  form.addEventListener('submit', submit);
  $('[data-edit-tray]').addEventListener('click', () => { $('[data-tray-done]').hidden = true; form.hidden = false; form.elements.name.focus(); });
  form.elements.when.min = new Date().toLocaleDateString('en-CA'); // local YYYY-MM-DD (toISOString would be UTC)

  render();
}
