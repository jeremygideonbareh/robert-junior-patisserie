// Organic, slowly morphing blobs (the Délice "goo" backdrop), drawn as a closed Catmull-Rom curve.
// Each <svg data-blob="seed"> gets a path whose radii drift with layered sines; scroll velocity adds a little wobble.
import { gsap } from 'gsap';

const N = 9; // control points

function pathFrom(radii, cx = 100, cy = 100) {
  const pts = radii.map((r, i) => {
    const a = (i / radii.length) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + 'Z';
}

export function initBlobs({ lenis, reduced }) {
  const blobs = [...document.querySelectorAll('svg[data-blob]')].map((svg) => {
    const seed = +svg.dataset.blob || 1;
    const amp = +(svg.dataset.blobAmp || 0.2);
    const phases = Array.from({ length: N }, (_, i) => [(seed * 1.7 + i * 2.3) % 6.28, (seed * 0.9 + i * 1.1) % 6.28]);
    return { svg, path: svg.querySelector('path'), seed, amp, phases, on: false };
  });
  const draw = (b, t, wob) => {
    const radii = b.phases.map(([p1, p2], i) => 72 * (1 + b.amp * (0.6 * Math.sin(t * 0.35 + p1) + 0.4 * Math.sin(t * 0.61 + p2 + i)) + wob * Math.sin(i * 2 + t * 3)));
    b.path.setAttribute('d', pathFrom(radii));
  };
  blobs.forEach((b) => draw(b, b.seed, 0));
  if (reduced) return;

  const io = new IntersectionObserver((es) => es.forEach((e) => { const b = blobs.find((x) => x.svg === e.target); if (b) b.on = e.isIntersecting; }), { rootMargin: '20% 0px' });
  blobs.forEach((b) => io.observe(b.svg));
  let wob = 0;
  gsap.ticker.add((time) => {
    const v = lenis ? Math.min(Math.abs(lenis.velocity) / 60, 0.08) : 0;
    wob += (v - wob) * 0.05;
    for (const b of blobs) if (b.on) draw(b, time + b.seed * 10, wob);
  });
  // blobs drift and slowly turn as their section scrolls past (depth)
  blobs.forEach((b, i) => gsap.fromTo(b.svg, { yPercent: 12, rotate: -8 * (i % 2 ? 1 : -1) }, {
    yPercent: -12, rotate: 8 * (i % 2 ? 1 : -1), ease: 'none',
    scrollTrigger: { trigger: b.svg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
  }));
}

// Curved text (Délice curvedText): circle path through the SVG's viewBox so text sits on a ring.
export function initArcs() {
  document.querySelectorAll('svg.arc, svg.stamp__ring').forEach((svg) => {
    const path = svg.querySelector('path');
    const full = svg.classList.contains('stamp__ring');
    const r = full ? 262 : 262; // viewBox 600 → ring radius
    const cx = 300, cy = 300;
    // start at the left so startOffset 25% centres the text at the top of the ring
    path.setAttribute('d', `M ${cx - r},${cy} a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`);
    path.setAttribute('fill', 'none');
  });
}
