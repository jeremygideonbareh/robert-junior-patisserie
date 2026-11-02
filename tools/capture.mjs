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
  ['01-hero', '.hero', 0], ['02-kitchen', '#kitchen', 0.3],
  ['03-serve-00', '#serve', 0.0], ['04-serve-35', '#serve', 0.35], ['05-serve-55', '#serve', 0.55], ['06-serve-75', '#serve', 0.75], ['07-serve-100', '#serve', 1],
  ['08-counter-00', '#counter', 0.0], ['09-counter-50', '#counter', 0.5], ['10-counter-100', '#counter', 1],
  ['11-band', '.band', 0.4], ['12-numbers', '#numbers', 0.35], ['13-posts', '#stayed', 0.3], ['14-cakes', '#cakes', 0.35],
  ['15-visit', '#visit', 0.4], ['16-cta', '.cta', 0.45], ['17-footer', '.footer', 1],
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
  if (await page.$('#loader')) await page.waitForSelector('#loader.is-gone, #loader.is-done', { state: 'attached', timeout: 20000 }).catch(() => errors.push(`[${name}] loader never finished`));
  await page.waitForTimeout(3200);
  for (const [label, sel, frac] of STOPS) {
    await page.evaluate(([sel, frac]) => {
      const el = document.querySelector(sel);
      const top = el.getBoundingClientRect().top + scrollY;
      const pinned = el.offsetHeight > innerHeight * 1.5;
      const y = pinned ? top + (el.offsetHeight - innerHeight) * frac : top - innerHeight * 0.2 + el.offsetHeight * frac;
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
