# Convert Blender PNG frames (RGBA) to web-ready WebP with alpha for the scroll sequence.
import glob, os
from PIL import Image
src = os.path.join(os.path.dirname(__file__), 'frames')
dst = os.path.join(os.path.dirname(__file__), '..', 'public', 'seq')
os.makedirs(dst, exist_ok=True)
total = 0
for f in sorted(glob.glob(os.path.join(src, 'f_*.png'))):
    out = os.path.join(dst, os.path.basename(f)[:-4] + '.webp')
    if os.path.exists(out) and os.path.getmtime(out) > os.path.getmtime(f):
        total += os.path.getsize(out); continue
    Image.open(f).save(out, 'WEBP', quality=78, method=5)
    total += os.path.getsize(out)
print(len(os.listdir(dst)), 'frames', round(total / 1e6, 2), 'MB')
