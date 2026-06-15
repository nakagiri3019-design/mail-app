from PIL import Image, ImageDraw
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

GREEN = (6, 199, 85, 255)   # #06C755
WHITE = (255, 255, 255, 255)

SS = 4  # supersampling factor

def draw_lime_icon(size):
    s = size * SS
    canvas = Image.new('RGBA', (s, s), GREEN)
    d = ImageDraw.Draw(canvas)

    # rounded-square background
    corner_r = int(s * 0.22)
    d.rounded_rectangle([0, 0, s, s], radius=corner_r, fill=GREEN)

    # Speech bubble body: white rounded rectangle
    pad = int(s * 0.18)
    bbl_left   = pad
    bbl_top    = int(s * 0.20)
    bbl_right  = s - pad
    bbl_bottom = int(s * 0.68)
    bbl_r = int((bbl_right - bbl_left) * 0.14)
    d.rounded_rectangle([bbl_left, bbl_top, bbl_right, bbl_bottom],
                        radius=bbl_r, fill=WHITE)

    # Tail: small triangle below bubble, left side
    tail_w = int(s * 0.12)
    tail_h = int(s * 0.12)
    tail_x = bbl_left + int(s * 0.10)
    tail_top = bbl_bottom - 2  # overlap slightly to avoid gap
    tail_points = [
        (tail_x, tail_top),
        (tail_x + tail_w, tail_top),
        (tail_x, tail_top + tail_h),
    ]
    d.polygon(tail_points, fill=WHITE)

    return canvas.resize((size, size), Image.LANCZOS)

for size in (192, 512):
    img = draw_lime_icon(size)
    img.save(os.path.join(OUT_DIR, f'lime_nakagiri_{size}.png'))
    print(f'Saved icons/lime_nakagiri_{size}.png')

print('Done.')
