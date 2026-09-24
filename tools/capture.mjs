// Scroll through the page like a visitor and screenshot each chapter (desktop + mobile).
// usage: node tools/capture.mjs <url> <outDir> [desktop|mobile|both]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const url = process.argv[2] || 'http://localhost:5190/?motion=full';
const out = process.argv[3] || 'shots';
const which = process.argv[4] || 'both';
fs.mkdirSync(out, { recursive: true });

const pwDir = path.join(os.homedir(), 'AppData/Local/ms-playwright');
const chromeDir = fs.readdirSync(pwDir).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const executablePath = path.join(pwDir, chromeDir, 'chrome-win64', 'chrome.exe');

const STOPS = [
  ['01-hero', '#hero', 0], ['02-seq-10', '#seq', 0.1], ['03-seq-40', '#seq', 0.4], ['04-seq-70', '#seq', 0.7], ['05-seq-95', '#seq', 0.97],
  ['06-dough-15', '#dough', 0.15], ['07-dough-70', '#dough', 0.7], ['08-numbers', '#numbers', 0.35], ['09-process-10', '#process', 0.1],
  ['10-process-60', '#process', 0.6], ['11-marquee', '.marquee', 0.3], ['12-counter', '#counter', 0.25], ['13-views', '#views', 0.3],
  ['14-stayed', '#stayed', 0.3], ['15-visit', '#visit', 0.35], ['16-footer', '#footer', 1],
];

const browser = await chromium.launch({ executablePath, args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=d3d11'] });
const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
const errors = [];
for (const name of which === 'both' ? ['desktop', 'mobile'] : [which]) {
  const s = sizes[name];
  const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, isMobile: s.isMobile, hasTouch: s.hasTouch, deviceScaleFactor: s.deviceScaleFactor || 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(`[${name}] ${m.type()}: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.screenshot({ path: `${out}/${name}-00-loader.png` });
  await page.waitForSelector('#loader.is-gone', { state: 'attached', timeout: 20000 }).catch(() => errors.push(`[${name}] loader never finished`));
  await page.waitForTimeout(2600);
  for (const [label, sel, frac] of STOPS) {
    await page.evaluate(([sel, frac]) => {
      const el = document.querySelector(sel);
      const top = el.getBoundingClientRect().top + scrollY;
      const y = top + Math.max(0, el.offsetHeight - innerHeight) * frac + (frac === 1 ? el.offsetHeight : 0);
      window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y);
    }, [sel, frac]);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${out}/${name}-${label}.png` });
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/errors.txt`, errors.join('\n') || 'no console errors');
console.log(errors.length ? errors.join('\n') : 'no console errors');
