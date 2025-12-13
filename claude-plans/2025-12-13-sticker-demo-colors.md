# Sticker Demo Color Extraction Plan

*Created: 2025-12-13*

## Problem

The sticker demo page at ynai.app shows a visible square around stickers because:
1. Each SVG has its own background color baked in (mostly white `#fff`, some colored)
2. The page background was set to a single color that doesn't match all SVGs
3. Text color is static when it could dynamically match each sticker's palette

## Goal

1. Extract the **actual background color** from each SVG (the outermost fill)
2. Extract a **prominent accent color** from each SVG for dynamic text
3. Update the STICKERS array with both values
4. Make title text color change with each sticker shuffle

---

## SVG Color Analysis

From exploration of 15+ SVGs:

### Background Colors Found
| Sticker Type | Background |
|--------------|------------|
| Most stickers (food, nerdy, summer, sports) | `#fff` (white) |
| Barbershop | `#f5d30d` (yellow) |
| Motorcycle | `#8063ab` (purple) |
| Some retro badges | Various colors |

### Prominent Colors for Text (good contrast)
- Neon teal: `#0aff9f`
- Bright blue: `#3bb4fb`
- Orange-red: `#fb582d`
- Forest green: `#1fb256`
- Red: `#ef4b4c`, `#ec4238`
- Purple: `#6842d5`
- Navy: `#1565ad`

---

## Implementation Plan

### Approach: Manual Extraction
Since there are only ~27 stickers, manual extraction is faster and more accurate than building a script.

### Step 1: Extract Colors (Manual)
For each SVG in `public/stickers/selected/`:
1. Open SVG, find first `fill:` after `</defs>` (outer background)
2. Find 2-3 most prominent saturated colors
3. Pick one that contrasts well with the background for text

### Step 2: Update STICKERS Array
Update `app/page.tsx`:
```typescript
const STICKERS: {
  file: string
  bgColor: string
  textColor: string
}[] = [
  { file: 'pizza.svg', bgColor: '#ffffff', textColor: '#ef4b4c' },
  { file: 'barbershop.svg', bgColor: '#f5d30d', textColor: '#3d3d3d' },
  // ... etc
]
```

### Step 3: Dynamic Text Color
Update the `<h1>` to use `currentSticker.textColor`:
```tsx
<h1 style={{ color: currentSticker.textColor }}>
  ynai
</h1>
```

### Step 4: Optional - Dynamic Button
Consider making button colors also dynamic (background + text from sticker palette).

---

## Files to Modify

1. **EDIT**: `web/app/page.tsx` - Update STICKERS array with bgColor + textColor, add dynamic text styling

---

## Extracted Colors (COMPLETE)

| Sticker | bgColor | textColor |
|---------|---------|-----------|
| pizza | `#fff` | `#e0330b` (red) |
| sandwich | `#fff` | `#f05924` (orange) |
| doughnut | `#fff` | `#e8cd0e` (yellow) |
| sushi | `#fff` | `#ef4f50` (red) |
| pancake | `#fff` | `#fbb810` (yellow) |
| ice-cream | `#ede9e0` (cream) | `#db4f65` (pink) |
| shopping-cart | `#fff` | `#04d79b` (teal) |
| funny-box | `#fff` | `#ffb93d` (orange) |
| floppy-disk | `#fff` | `#6842d5` (purple) |
| retro-phone | `#fff` | `#04d79b` (teal) |
| game-watch | `#fff` | `#ec4238` (red) |
| running-club | `#ede9e0` (cream) | `#1565ad` (navy) |
| basketball | `#fff` | `#f26529` (orange) |
| punch-glove | `#fff` | `#e94034` (red) |
| transport-travel | `#7ad1ee` (teal) | `#ec5728` (orange) |
| electronic-vehicle | `#ede9e0` (cream) | `#1fb256` (green) |
| flamingo | `#fff2d9` (warm cream) | `#eb6f93` (pink) |
| gift-box | `#fff` | `#e93b3e` (red) |
| crown | `#fff` | `#e63f3e` (red) |
| health-care | `#7ad1ee` (teal) | `#ec5728` (orange) |
| barbershop | `#f5d30d` (yellow) | `#7b64ac` (purple) |
| earth | `#ede9e0` (cream) | `#1fb256` (green) |
| ghost | `#3f110f` (dark brown) | `#dc9fc7` (pink) |
| pest-control | `#759b3e` (green) | `#f2e9df` (cream) |
| architecture | `#e7e226` (yellow) | `#3356a7` (blue) |
| motorcycle | `#8063ab` (purple) | `#fddb00` (yellow) |

## Ready to Implement

Update `page.tsx` with this STICKERS array:

```typescript
const STICKERS: { file: string; bgColor: string; textColor: string }[] = [
  // Food
  { file: 'mf7_food-retro-cartoon-vol-01-surprised-pizza.svg', bgColor: '#fff', textColor: '#e0330b' },
  { file: 'mf7_food-retro-cartoon-vol-01-funny-sandwich.svg', bgColor: '#fff', textColor: '#f05924' },
  { file: 'mf7_food-retro-cartoon-vol-01-happy-doughnut.svg', bgColor: '#fff', textColor: '#e8cd0e' },
  { file: 'mf16_food-retro-cartoon-vol-02-angry-sushi.svg', bgColor: '#fff', textColor: '#ef4f50' },
  { file: 'mf16_food-retro-cartoon-vol-02-honey-pancake.svg', bgColor: '#fff', textColor: '#fbb810' },
  { file: 'mf33_retro-cartoon-ice-cream-logo-badges-ice-cream-cone.svg', bgColor: '#ede9e0', textColor: '#db4f65' },

  // Shopping
  { file: 'mf4_shopping-character-vol-01-shopping-cart.svg', bgColor: '#fff', textColor: '#04d79b' },
  { file: 'mf4_shopping-character-vol-01-funny-box.svg', bgColor: '#fff', textColor: '#ffb93d' },

  // Tech
  { file: 'mf13_nerdy-things-cartoon-vol-3-floppy-disk.svg', bgColor: '#fff', textColor: '#6842d5' },
  { file: 'mf13_nerdy-things-cartoon-vol-3-retro-phone.svg', bgColor: '#fff', textColor: '#04d79b' },
  { file: 'mf11_nerdy-things-cartoon-character-vol-1-cute-game-watch.svg', bgColor: '#fff', textColor: '#ec4238' },

  // Sports
  { file: 'mf14_retro-cartoon-sport-logo-badges-running-club.svg', bgColor: '#ede9e0', textColor: '#1565ad' },
  { file: 'mf2_sports-character-cartoon-vol-01-happy-basketball.svg', bgColor: '#fff', textColor: '#f26529' },
  { file: 'mf30_sports-character-cartoon-vol-03-punch-glove.svg', bgColor: '#fff', textColor: '#e94034' },

  // Transport
  { file: 'mf3_retro-logo-badges-transport-&-travel.svg', bgColor: '#7ad1ee', textColor: '#ec5728' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-electronic-vehicle.svg', bgColor: '#ede9e0', textColor: '#1fb256' },

  // Seasonal
  { file: 'mf24_summer-cartoon-character-vol-01-flamingo.svg', bgColor: '#fff2d9', textColor: '#eb6f93' },
  { file: 'mf5_winter-character-badge-gift-box.svg', bgColor: '#fff', textColor: '#e93b3e' },
  { file: 'mf25_new-year-badge-vol-3-cute-crown.svg', bgColor: '#fff', textColor: '#e63f3e' },

  // Services
  { file: 'mf3_retro-logo-badges-health-care.svg', bgColor: '#7ad1ee', textColor: '#ec5728' },
  { file: 'mf9_vintage-logo-badges-barbershop.svg', bgColor: '#f5d30d', textColor: '#7b64ac' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-earth.svg', bgColor: '#ede9e0', textColor: '#1fb256' },
  { file: 'mf29_vintage-logo-badges-ghost.svg', bgColor: '#3f110f', textColor: '#dc9fc7' },
  { file: 'mf8_vintage-logo-badges-pest-control.svg', bgColor: '#759b3e', textColor: '#f2e9df' },
  { file: 'mf3_retro-logo-badges-architecture.svg', bgColor: '#e7e226', textColor: '#3356a7' },
  { file: 'mf9_vintage-logo-badges-motorcycle.svg', bgColor: '#8063ab', textColor: '#fddb00' },
]
```

Then update `<h1>` to use dynamic text color:
```tsx
<h1 style={{ color: currentSticker.textColor }}>
```
