// Scroll-scrubbed frame sequence (rendered in Blender Cycles: blender/tart-sequence.blend).
export const FRAME_COUNT = 96;
const src = (i) => `seq/f_${String(i + 1).padStart(4, '0')}.webp`;

export function createSequence(canvas) {
  const ctx = canvas.getContext('2d');
  const frames = new Array(FRAME_COUNT);
  let current = -1, want = 0, loaded = 0, w = 0, h = 0;
  const last = { dx: 0, dy: 0, s: 1 }; // where the frame was drawn, for the bridge hand-off

  function size() {
    const dpr = Math.min(devicePixelRatio, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    current = -1; draw(want);
  }

  // nearest decoded frame so fast scrolling never shows a blank
  function nearest(i) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (frames[i - d]?.complete && frames[i - d].naturalWidth) return frames[i - d];
      if (frames[i + d]?.complete && frames[i + d].naturalWidth) return frames[i + d];
    }
    return null;
  }

  function draw(i) {
    want = i;
    if (i === current) return;
    const img = nearest(i);
    if (!img) return;
    current = img === frames[i] ? i : -1;
    ctx.clearRect(0, 0, w, h);
    // contain, slightly oversized, anchored a touch right of centre on wide screens
    const portrait = w / h < 0.9;
    const s = Math.min(w / img.naturalWidth, h / img.naturalHeight) * (portrait ? 1.35 : 1.08);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    const dx = (w - dw) / 2 + (portrait ? 0 : w * 0.03);
    const dy = (h - dh) / 2 + (portrait ? -h * 0.12 : 0);
    ctx.drawImage(img, dx, dy, dw, dh);
    last.dx = dx; last.dy = dy; last.s = s;
  }

  // first frame, then the rest in scroll order
  function load(onProgress) {
    return new Promise((resolve) => {
      let firstDone = false;
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = img.onerror = () => {
          loaded++;
          onProgress?.(loaded / FRAME_COUNT);
          if (i === want || !firstDone) { firstDone = true; current = -1; draw(want); }
          if (loaded === FRAME_COUNT) resolve();
        };
        img.src = src(i);
        frames[i] = img;
      }
    });
  }

  addEventListener('resize', size);
  size();
  // tart in the final frame: centre (640, 459), square crop 758px (matches img/plate-tart.webp)
  const tartRect = () => ({ cx: last.dx + 640 * last.s, cy: last.dy + 459 * last.s, size: 758 * last.s });
  return { load, draw, tartRect, setProgress: (p) => draw(Math.round(p * (FRAME_COUNT - 1))) };
}
