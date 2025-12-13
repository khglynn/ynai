# SVG Color Extraction Method

*Created: 2025-12-13*

## Overview

Method for extracting background and accent colors from SVG sticker files to enable dynamic theming.

## Quick Extraction (Single File)

```bash
head -c 15000 sticker.svg | grep -oE 'fill:#[0-9a-fA-F]{3,6}' | head -15
```

**What this does:**
- `head -c 15000` - Read first 15KB of the SVG (usually contains all color defs)
- `grep -oE 'fill:#[0-9a-fA-F]{3,6}'` - Extract all fill colors (3 or 6 digit hex)
- First color is typically the background
- Subsequent colors are accent/feature colors

## Batch Extraction Script

```bash
#!/bin/bash
for svg in *.svg; do
  colors=$(head -c 20000 "$svg" | grep -oE 'fill:#[0-9a-fA-F]{3,6}' | head -20)

  # First fill is usually background
  bg=$(echo "$colors" | head -1 | sed 's/fill://')

  # Find first saturated non-white/black color
  text=$(echo "$colors" | grep -vE 'fff|feff|000|231f|221f' | head -1 | sed 's/fill://')

  [ -z "$text" ] && text=$(echo "$colors" | sed -n '2p' | sed 's/fill://')

  echo "{ file: '$svg', bgColor: '$bg', textColor: '$text' },"
done
```

## SVG Structure Notes

### Character-style SVGs (mf2_, mf4_, mf7_, etc.)
- Background: Usually `#fff` or `#feffff`
- First fill after `</defs>` is the background
- Accent colors are clearly saturated

### Badge-style SVGs (mf3_, mf8_, mf9_, mf14_, mf22_, etc.)
- Background: Often colored (teal, yellow, purple, cream)
- Text color needs manual selection from the palette
- Run `grep -oE 'fill:#[0-9a-fA-F]{3,6}' file.svg | sort -u` to see all unique colors

## Common Background Colors Found

| Color | Hex | Used In |
|-------|-----|---------|
| White | `#fff` / `#feffff` | Most character stickers |
| Cream | `#ede9e0` / `#f6eadf` | Badge-style stickers |
| Warm cream | `#fff2d9` | Summer stickers |
| Teal | `#7ad1ee` / `#76b3e2` | Health, transport badges |
| Yellow | `#f5d30d` / `#f7b917` | Food truck, barbershop |
| Purple | `#8063ab` | Motorcycle badge |
| Green | `#759b3e` / `#36803d` | Pest control, financial |
| Blue | `#3356a7` | Coffee shop badge |
| Dark brown | `#3f110f` | Halloween badges |

## Color Distance Algorithm

To avoid similar colors appearing back-to-back, use Euclidean distance in RGB space:

```typescript
function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  )
}

// Distance > 80 ensures visually distinct colors
```

## Manual Refinement Process

For badge SVGs where auto-extraction fails:

1. Get all unique colors: `grep -oE 'fill:#[0-9a-fA-F]{3,6}' file.svg | sort -u`
2. Identify the background (usually first or most repeated)
3. Pick a contrasting accent color for text
4. Verify contrast ratio is readable

## File Locations

- Stickers: `web/public/stickers/selected/`
- Color array: `web/app/page.tsx` (STICKERS constant)
- Paper texture: `web/app/globals.css`

## Paper Texture Settings (Final)

```css
.paper-texture {
  background: url("data:image/svg+xml,...feTurbulence baseFrequency='0.5 0.65' numOctaves='4'...");
  background-size: 300px 300px;
  opacity: 0.4;  /* Adjust to taste, 0.15-0.25 for subtle */
  mix-blend-mode: multiply;
}
```

Key settings:
- `baseFrequency='0.5 0.65'` - larger grain with subtle horizontal fiber direction
- `numOctaves='4'` - detail complexity
- `mix-blend-mode: multiply` - darkens underlying colors naturally
- Applied via `z-50` overlay so it affects both background AND sticker
