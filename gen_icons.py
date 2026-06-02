from PIL import Image, ImageDraw, ImageFont
import os

os.chdir(os.path.dirname(__file__) or '.')

s = 192
img = Image.new('RGBA', (s, s), (26, 26, 46, 255))
d = ImageDraw.Draw(img)
d.rounded_rectangle([12, 12, s - 13, s - 13], radius=24, fill=(56, 189, 248, 255))

try:
    f = ImageFont.truetype('arialbd.ttf', 72)
except:
    f = ImageFont.load_default()

bb = d.textbbox((0, 0), 'N', font=f)
tw = bb[2] - bb[0]
th = bb[3] - bb[1]
d.text(((s - tw) / 2, (s - th) / 2 - 6), 'N', fill=(26, 26, 46, 255), font=f)

img.save('icon-192.png')
img.save('glass-app/icon-192.png')

img2 = img.resize((512, 512), Image.LANCZOS)
img2.save('icon-512.png')
img2.save('glass-app/icon-512.png')

mask = Image.new('RGBA', (s, s), (56, 189, 248, 255))
d2 = ImageDraw.Draw(mask)
bb2 = d2.textbbox((0, 0), 'N', font=f)
tw2 = bb2[2] - bb2[0]
th2 = bb2[3] - bb2[1]
d2.text(((s - tw2) / 2, (s - th2) / 2 - 6), 'N', fill=(26, 26, 46, 255), font=f)
mask.save('icon-192-maskable.png')
mask.save('glass-app/icon-192-maskable.png')

m512 = mask.resize((512, 512), Image.LANCZOS)
m512.save('icon-512-maskable.png')
m512.save('glass-app/icon-512-maskable.png')

print('ALL ICONS OK')
print('Files:', [f for f in os.listdir('.') if f.startswith('icon-')])
