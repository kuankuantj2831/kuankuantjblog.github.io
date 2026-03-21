"""生成 PWA 图标和 iOS 启动画面"""
from PIL import Image, ImageDraw, ImageFont
import os

ICONS_DIR = os.path.join(os.path.dirname(__file__), 'images', 'icons')
os.makedirs(ICONS_DIR, exist_ok=True)

def make_icon(size, filename):
    """生成带渐变背景和猫爪emoji的图标"""
    img = Image.new('RGBA', (size, size))
    draw = ImageDraw.Draw(img)
    
    # 渐变背景 #667eea → #764ba2
    for y in range(size):
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # 圆角遮罩
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = size // 5
    mask_draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    img.putalpha(mask)
    
    # 绘制文字 "猫" 
    font_size = int(size * 0.5)
    try:
        font = ImageFont.truetype("msyh.ttc", font_size)
    except:
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", font_size)
        except:
            font = ImageFont.load_default()
    
    bbox = draw.textbbox((0, 0), "猫", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) // 2
    y = (size - th) // 2 - bbox[1]
    draw.text((x, y), "猫", fill=(255, 255, 255, 255), font=font)
    
    img.save(os.path.join(ICONS_DIR, filename), 'PNG')
    print(f'  ✅ {filename} ({size}x{size})')

def make_splash(width, height, filename):
    """生成 iOS 启动画面"""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # 渐变背景
    for y in range(height):
        r = int(102 + (118 - 102) * y / height)
        g = int(126 + (75 - 126) * y / height)
        b = int(234 + (162 - 234) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # 标题文字
    try:
        title_font = ImageFont.truetype("msyh.ttc", int(width * 0.08))
        sub_font = ImageFont.truetype("msyh.ttc", int(width * 0.04))
    except:
        try:
            title_font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", int(width * 0.08))
            sub_font = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", int(width * 0.04))
        except:
            title_font = ImageFont.load_default()
            sub_font = ImageFont.load_default()
    
    # 猫爬架 emoji + 标题
    title = "🐱 猫爬架"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) // 2, height // 2 - int(height * 0.06)), title, fill=(255, 255, 255), font=title_font)
    
    sub = "Hakimi 的猫爬架"
    bbox2 = draw.textbbox((0, 0), sub, font=sub_font)
    tw2 = bbox2[2] - bbox2[0]
    draw.text(((width - tw2) // 2, height // 2 + int(height * 0.04)), sub, fill=(255, 255, 255, 200), font=sub_font)
    
    img.save(os.path.join(ICONS_DIR, filename), 'PNG')
    print(f'  ✅ {filename} ({width}x{height})')

print('📱 生成 PWA 图标...')
for size in [72, 96, 128, 144, 152, 192, 384, 512]:
    make_icon(size, f'icon-{size}x{size}.png')

print('\n📱 生成 iOS 启动画面...')
splashes = [
    (640, 1136, 'splash-640x1136.png'),
    (750, 1334, 'splash-750x1334.png'),
    (1242, 2208, 'splash-1242x2208.png'),
    (1125, 2436, 'splash-1125x2436.png'),
    (1170, 2532, 'splash-1170x2532.png'),
    (1179, 2556, 'splash-1179x2556.png'),
]
for w, h, name in splashes:
    make_splash(w, h, name)

print('\n✅ 全部生成完成！')
