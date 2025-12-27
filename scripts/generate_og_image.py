#!/usr/bin/env python3
"""
Generate cute OG image with HUGE stickers bleeding off edges
Uses only beige-background (#ede9e0) stickers that blend with canvas
"""
from PIL import Image, ImageDraw, ImageFont
import subprocess
import tempfile
import urllib.request
import random
import os
import math

# Paths
STICKERS_DIR = "/Users/KevinHG/DevKev/personal/ynai/web/public/stickers/selected"
OUTPUT_PATH = "/Users/KevinHG/DevKev/personal/ynai/web/app/opengraph-image.png"
FONT_PATH = "/Users/KevinHG/DevKev/personal/ynai/scripts/Fredoka-Bold.ttf"

# Dimensions for OG image
WIDTH = 1200
HEIGHT = 630

# Beige/cream background (matches app paper texture)
BG_COLOR = (237, 233, 224)  # #ede9e0

# Text color - retro-teal from tailwind config
TEXT_COLOR = (45, 122, 122)  # #2D7A7A

# ONLY stickers with #ede9e0 background (blend with canvas)
BEIGE_BG_STICKERS = [
    # Ice cream badges
    'mf33_retro-cartoon-ice-cream-logo-badges-ice-cream-cone.svg',
    'mf33_retro-cartoon-ice-cream-logo-badges-popsicle.svg',
    # Sports badges
    'mf14_retro-cartoon-sport-logo-badges-running-club.svg',
    'mf14_retro-cartoon-sport-logo-badges-basketball.svg',
    'mf14_retro-cartoon-sport-logo-badges-racing-team.svg',
    # Eco badges
    'mf22_retro-cartoon-eco-friendly-logo-badges-cycling.svg',
    'mf22_retro-cartoon-eco-friendly-logo-badges-earth.svg',
    'mf22_retro-cartoon-eco-friendly-logo-badges-reusable-bag.svg',
    'mf22_retro-cartoon-eco-friendly-logo-badges-solar-panel.svg',
    'mf22_retro-cartoon-eco-friendly-logo-badges-tumbler.svg',
    'mf22_retro-cartoon-eco-friendly-logo-badges-electronic-vehicle.svg',
]


def download_fredoka():
    """Download Fredoka Bold from Google Fonts if not present"""
    if os.path.exists(FONT_PATH):
        print(f"Using cached font: {FONT_PATH}")
        return FONT_PATH

    print("Downloading Fredoka Bold from Google Fonts...")
    # Google Fonts API URL for Fredoka Bold (weight 700)
    url = "https://github.com/nicholaswilson/Fredoka/raw/main/fonts/ttf/Fredoka-Bold.ttf"

    try:
        urllib.request.urlretrieve(url, FONT_PATH)
        print(f"Downloaded to: {FONT_PATH}")
        return FONT_PATH
    except Exception as e:
        print(f"Failed to download Fredoka: {e}")
        # Try alternate source
        alt_url = "https://fonts.gstatic.com/s/fredoka/v14/X7nP4b87HvSqjb_WIi0.ttf"
        try:
            urllib.request.urlretrieve(alt_url, FONT_PATH)
            print(f"Downloaded from alternate source")
            return FONT_PATH
        except Exception as e2:
            print(f"Alternate also failed: {e2}")
            return None


def load_svg_as_image(svg_path, size):
    """Load SVG and convert to PIL Image using inkscape"""
    try:
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp_path = tmp.name

        # Use inkscape to convert SVG to PNG
        subprocess.run([
            'inkscape', svg_path,
            '--export-filename', tmp_path,
            '--export-width', str(size),
            '--export-height', str(size),
        ], capture_output=True, check=True)

        img = Image.open(tmp_path).convert('RGBA')
        os.unlink(tmp_path)
        return img
    except Exception as e:
        print(f"Failed to load {svg_path}: {e}")
        return None


def create_paper_texture(width, height, base_color):
    """Create paper texture background matching globals.css paper-texture"""
    img = Image.new('RGBA', (width, height), base_color)
    draw = ImageDraw.Draw(img)

    # Paper grain - denser, more natural texture
    random.seed(42)  # Consistent texture

    # Layer 1: Fine grain (lots of tiny specks)
    for _ in range(25000):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        # Slight variation in brightness
        variation = random.randint(-6, 6)
        r = max(0, min(255, base_color[0] + variation))
        g = max(0, min(255, base_color[1] + variation))
        b = max(0, min(255, base_color[2] + variation))
        draw.point((x, y), fill=(r, g, b, 255))

    # Layer 2: Larger fibers (horizontal direction like paper)
    for _ in range(3000):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        # Horizontal fiber lines
        fiber_len = random.randint(2, 6)
        variation = random.randint(-10, 10)
        r = max(0, min(255, base_color[0] + variation))
        g = max(0, min(255, base_color[1] + variation))
        b = max(0, min(255, base_color[2] + variation))
        for dx in range(fiber_len):
            if x + dx < width:
                draw.point((x + dx, y), fill=(r, g, b, 255))

    return img


def get_sticker_positions():
    """
    HUGE stickers that bleed off canvas edges - no corner stacking
    Returns list of (x, y, size, rotation) tuples
    Positions are centers, so negative/off-canvas positions = bleed off edge
    """
    # Different sizes for variety, all HUGE - 50% more visible than before
    positions = [
        # Left edge - scooted in so we see ~60% of sticker
        (60, 315, 380, -8),       # Center-left

        # Right edge - scooted in so we see ~60% of sticker
        (1140, 315, 380, 10),     # Center-right

        # Top edge - scooted down so we see more
        (280, 50, 320, 12),       # Top-left area
        (920, 70, 300, -6),       # Top-right area

        # Bottom edge - scooted up so we see more
        (280, 580, 340, -10),     # Bottom-left area
        (920, 560, 320, 8),       # Bottom-right area
    ]

    return positions


def main():
    print("Creating cute OG image with HUGE bleeding stickers...")

    # Download font if needed
    font_path = download_fredoka()

    # Create paper texture background
    bg = create_paper_texture(WIDTH, HEIGHT, BG_COLOR)

    # Use only beige-background stickers that blend with canvas
    random.seed(123)  # Consistent sticker selection
    stickers_to_use = BEIGE_BG_STICKERS.copy()
    random.shuffle(stickers_to_use)

    # Get positions with individual sizes
    positions = get_sticker_positions()

    print(f"Placing {len(positions)} HUGE stickers bleeding off edges...")

    for i, (x, y, size, rotation) in enumerate(positions):
        if i >= len(stickers_to_use):
            break

        sticker_file = stickers_to_use[i]
        svg_path = os.path.join(STICKERS_DIR, sticker_file)
        if not os.path.exists(svg_path):
            print(f"  Skipping missing sticker: {sticker_file}")
            continue

        # Load sticker at specified size (HUGE!)
        sticker = load_svg_as_image(svg_path, size)
        if sticker is None:
            continue

        # Rotate sticker
        rotated = sticker.rotate(rotation, expand=True, resample=Image.BICUBIC)

        # Calculate paste position (centered on x, y)
        # Negative or off-canvas positions will bleed off edges
        paste_x = int(x - rotated.width // 2)
        paste_y = int(y - rotated.height // 2)

        # Paste onto background
        bg.paste(rotated, (paste_x, paste_y), rotated)
        print(f"  Placed: {sticker_file} ({size}px at {x},{y})")

    # Add center text with Fredoka Bold - BIGGER
    draw = ImageDraw.Draw(bg)

    # Load Fredoka Bold - bigger font size
    font_size = 96  # Bigger than before
    try:
        if font_path and os.path.exists(font_path):
            font = ImageFont.truetype(font_path, font_size)
            print(f"Using font: {font_path}")
        else:
            # Fallback
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
            print("Using fallback Helvetica")
    except Exception as e:
        print(f"Font error: {e}")
        font = ImageFont.load_default()

    # Draw text in center - BLUE from color palette
    text = "AI for your YNAB"

    # Get text size
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # Center position
    text_x = (WIDTH - text_width) // 2
    text_y = (HEIGHT - text_height) // 2

    # Draw main text in retro-teal blue
    draw.text((text_x, text_y), text, fill=TEXT_COLOR, font=font)

    # Save final image
    bg = bg.convert('RGB')
    bg.save(OUTPUT_PATH, 'PNG', quality=95)
    print(f"\n✓ Saved: {OUTPUT_PATH}")
    print(f"  Size: {WIDTH}x{HEIGHT}px")
    print(f"  Text color: #2D7A7A (retro-teal)")


if __name__ == "__main__":
    main()
