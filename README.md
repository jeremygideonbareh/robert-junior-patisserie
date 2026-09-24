# Robert Junior Pâtisserie — concept site

A motion-led demo site for [@robertjuniorpatisserie](https://www.instagram.com/robertjuniorpatisserie/), Shillong.

- **Stack:** Vite · Three.js · GSAP (ScrollTrigger, SplitText) · Lenis
- **3D:** pastries modelled procedurally in Blender 5.2 (`blender/pastries.blend`), exported to glTF + meshopt.
- **Scroll sequence:** 96-frame Cycles render of the raspberry vanilla tart being built (`blender/tart-sequence.blend`), scrubbed on scroll.
- **Ordering:** "tray" builder → order text copied → Instagram DM.

```bash
npm install
npm run dev        # http://localhost:5190
npm run build      # static site in dist/
```

Re-render the sequence: `blender -b blender/tart-sequence.blend -o //frames/f_#### -a`, then `python blender/frames_to_webp.py`.

Screenshot tour: `node tools/capture.mjs "http://localhost:5190/?motion=full" shots both`.

Visitors with "reduce motion" turned on get a calm static version, plus a button to opt into the full experience (`?motion=full`).

Photos © Robert Junior Pâtisserie (from their Instagram), used for this concept demo. See `DIRECTION.md` for what needs client confirmation before launch.
