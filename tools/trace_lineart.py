"""Lift the client's own white line drawing off its photo and vectorise it to an ink SVG.
usage: python tools/trace_lineart.py <src.jpg> <out.svg> [ink-hex]"""
import sys
import numpy as np
from PIL import Image, ImageFilter
import potrace

src, out = sys.argv[1], sys.argv[2]
ink = sys.argv[3] if len(sys.argv) > 3 else '#5a0e16'
im = Image.open(src).convert('RGB')
im = im.resize((im.width * 4, im.height * 4), Image.LANCZOS)          # smoother curves
a = np.asarray(im).astype(np.int16)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mx, mn = a.max(-1), a.min(-1)
white = (mn > 200) & ((mx - mn) < 38)                                  # bright and colourless = the drawing
mask = Image.fromarray((white * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
m = np.asarray(mask) > 127

# keep the drawing, drop photo leftovers (railing highlights, speckle on the floor)
from scipy import ndimage
crop = [int(v) for v in (sys.argv[4].split(',') if len(sys.argv) > 4 else (0, 0, m.shape[1], m.shape[0]))]  # x0,y0,x1,y1 (4x px)
keep = np.zeros_like(m)
keep[crop[1]:crop[3], crop[0]:crop[2]] = m[crop[1]:crop[3], crop[0]:crop[2]]
lab, n = ndimage.label(keep, structure=np.ones((3, 3)))
out_m = np.zeros_like(keep)
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    h = sl[0].stop - sl[0].start; w = sl[1].stop - sl[1].start
    comp = lab[sl] == i
    area = comp.sum()
    fill = area / max(1, h * w)
    if h > 160 and w < 60: continue            # a straight vertical rail glint
    if area < 220: continue                    # speckle
    if fill > 0.42 and area > 2500 and w > 60: continue   # solid blotch (floor reflections), drawings are thin lines
    out_m[sl][comp] = True
# hand-picked leftovers to erase, as x0,y0,x1,y1 in 4x pixels (argv[5] = "a,b,c,d;e,f,g,h")
for r in (sys.argv[5].split(';') if len(sys.argv) > 5 else []):
    x0, y0, x1, y1 = [int(float(v)) for v in r.split(',')]
    out_m[y0:y1, x0:x1] = False
mask = Image.fromarray((out_m * 255).astype(np.uint8))
bm = potrace.Bitmap(~out_m)  # potracer fills the False side, so hand it the inverse
path = bm.trace(turdsize=60, alphamax=1.0, opticurve=True, opttolerance=0.3)
W, H = mask.size
parts = []
for curve in path:
    s = curve.start_point
    d = [f'M{s.x:.1f},{s.y:.1f}']
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f'L{seg.c.x:.1f},{seg.c.y:.1f}L{seg.end_point.x:.1f},{seg.end_point.y:.1f}')
        else:
            d.append(f'C{seg.c1.x:.1f},{seg.c1.y:.1f} {seg.c2.x:.1f},{seg.c2.y:.1f} {seg.end_point.x:.1f},{seg.end_point.y:.1f}')
    parts.append(''.join(d) + 'Z')
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"><path fill="{ink}" fill-rule="evenodd" d="{"".join(parts)}"/></svg>'
open(out, 'w').write(svg)
mask.save(out.replace('.svg', '-mask.png'))
print(len(path), 'curves', W, H, len(svg) // 1024, 'KB')
