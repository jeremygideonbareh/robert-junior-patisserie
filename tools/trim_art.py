"""Cut each spot illustration down to the strokes inside its own crop, so cup.svg doesn't carry the whole waitress.
usage: python tools/trim_art.py   (run from the project root, after trace_lineart.py)"""
import re

src = open('public/art/waitress-cream.svg', encoding='utf8').read()
d = re.search(r' d="([^"]+)"', src).group(1)
subs = re.findall(r'M[^M]+', d)

def bbox(sub):
    n = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', sub)]
    xs, ys = n[0::2], n[1::2]
    return min(xs), min(ys), max(xs), max(ys)

def crop(name, x0, y0, x1, y1, ink):
    # keep every stroke that touches the crop: the cup and plate are joined to her arms, and the viewBox clips the rest
    keep = []
    for sub in subs:
        a, b, c, e = bbox(sub)
        if a < x1 and c > x0 and b < y1 and e > y0:
            keep.append(sub)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}"><path fill="{ink}" fill-rule="evenodd" d="{"".join(keep)}"/></svg>'
    open(f'public/art/{name}.svg', 'w', encoding='utf8').write(svg)
    print(name, len(keep), 'of', len(subs), 'strokes', len(svg) // 1024, 'KB')

crop('cup', 1360, 715, 1570, 935, '#5a0e16')
crop('plate', 525, 790, 880, 965, '#5a0e16')
