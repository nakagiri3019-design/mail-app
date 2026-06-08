from PIL import Image, ImageDraw
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

CREAM = (254, 247, 224, 255)
ORANGE = (255, 122, 0, 255)
WHITE = (255, 255, 255, 255)

SS = 4  # supersampling factor

def draw_envelope(size):
    canvas = Image.new('RGBA', (size * SS, size * SS), CREAM)
    d = ImageDraw.Draw(canvas)
    s = size * SS

    # rounded-square background
    pad = int(s * 0.06)
    d.rounded_rectangle([pad, pad, s - pad, s - pad], radius=int(s * 0.22), fill=CREAM)

    # envelope body
    margin = s * 0.22
    left, top, right, bottom = margin, s * 0.32, s - margin, s * 0.72
    radius = (right - left) * 0.08
    d.rounded_rectangle([left, top, right, bottom], radius=radius, fill=WHITE, outline=ORANGE, width=int(s * 0.022))

    # envelope flap (triangle)
    cx = (left + right) / 2
    d.polygon([(left, top), (right, top), (cx, (top + bottom) / 2 + (bottom - top) * 0.05)], fill=ORANGE)

    return canvas.resize((size, size), Image.LANCZOS)

for size in (192, 512):
    img = draw_envelope(size)
    img.save(os.path.join(OUT_DIR, f'icon-{size}.png'))

# apple-touch-icon: opaque background (no alpha), 180x180
apple = draw_envelope(180).convert('RGB')
apple.save(os.path.join(OUT_DIR, 'apple-touch-icon.png'))

print('Icons generated in', OUT_DIR)
