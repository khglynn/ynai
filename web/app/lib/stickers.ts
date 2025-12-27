// Sticker data and color utilities
// Extracted from page.tsx for reuse across components

export interface Sticker {
  file: string
  bgColor: string
  textColor: string
}

// All 64 stickers with background colors and accent text colors extracted from SVGs
export const STICKERS: Sticker[] = [
  // Food Characters
  { file: 'mf7_food-retro-cartoon-vol-01-surprised-pizza.svg', bgColor: '#fff', textColor: '#e0330b' },
  { file: 'mf7_food-retro-cartoon-vol-01-funny-sandwich.svg', bgColor: '#fff', textColor: '#f05924' },
  { file: 'mf7_food-retro-cartoon-vol-01-happy-doughnut.svg', bgColor: '#fff', textColor: '#e8cd0e' },
  { file: 'mf7_food-retro-cartoon-vol-01-lazy-noodle.svg', bgColor: '#fff', textColor: '#ef4f50' },
  { file: 'mf7_food-retro-cartoon-vol-01-old-hotdog.svg', bgColor: '#fff', textColor: '#23a155' },
  { file: 'mf16_food-retro-cartoon-vol-02-angry-sushi.svg', bgColor: '#fff', textColor: '#ef4f50' },
  { file: 'mf16_food-retro-cartoon-vol-02-honey-pancake.svg', bgColor: '#fff', textColor: '#fbb810' },
  { file: 'mf16_food-retro-cartoon-vol-02-lazy-meat.svg', bgColor: '#fff', textColor: '#ff9f00' },
  { file: 'mf16_food-retro-cartoon-vol-02-lazy-waffle.svg', bgColor: '#fff', textColor: '#d4a574' },
  { file: 'mf16_food-retro-cartoon-vol-02-triangle-sandwich.svg', bgColor: '#fff', textColor: '#f05924' },
  { file: 'mf31_fast-food-vol-02-happy-kebab.svg', bgColor: '#fff', textColor: '#f94646' },

  // Ice Cream & Dessert Badges
  { file: 'mf33_retro-cartoon-ice-cream-logo-badges-ice-cream-cone.svg', bgColor: '#ede9e0', textColor: '#db4f65' },
  { file: 'mf33_retro-cartoon-ice-cream-logo-badges-popsicle.svg', bgColor: '#ede9e0', textColor: '#d93427' },

  // Food Badges
  { file: 'mf17_retro-logo-badges-organic-food.svg', bgColor: '#76b3e2', textColor: '#54853c' },
  { file: 'mf19_vintage-logo-badges-food-truck.svg', bgColor: '#f7b917', textColor: '#dd4825' },

  // Shopping Characters
  { file: 'mf4_shopping-character-vol-01-shopping-cart.svg', bgColor: '#fff', textColor: '#04d79b' },
  { file: 'mf4_shopping-character-vol-01-funny-box.svg', bgColor: '#fff', textColor: '#ffb93d' },
  { file: 'mf4_shopping-character-vol-01-angry-handphone.svg', bgColor: '#fff', textColor: '#ff5b35' },
  { file: 'mf4_shopping-character-vol-01-package-box.svg', bgColor: '#fff', textColor: '#ff99f1' },
  { file: 'mf4_shopping-character-vol-01-shopping-bag.svg', bgColor: '#fff', textColor: '#ff5b35' },

  // Tech Characters
  { file: 'mf13_nerdy-things-cartoon-vol-3-floppy-disk.svg', bgColor: '#fff', textColor: '#6842d5' },
  { file: 'mf13_nerdy-things-cartoon-vol-3-retro-phone.svg', bgColor: '#fff', textColor: '#3bb4fb' },
  { file: 'mf13_nerdy-things-cartoon-vol-3-colorfull-mouse.svg', bgColor: '#fff', textColor: '#ff3342' },
  { file: 'mf13_nerdy-things-cartoon-vol-3-music-plate.svg', bgColor: '#fff', textColor: '#ff8fdd' },
  { file: 'mf13_nerdy-things-cartoon-vol-3-roll-film.svg', bgColor: '#fff', textColor: '#0aff9f' },
  { file: 'mf13_nerdy-things-cartoon-vol-3-tape-cassette.svg', bgColor: '#fff', textColor: '#6842d5' },
  { file: 'mf11_nerdy-things-cartoon-character-vol-1-cute-game-watch.svg', bgColor: '#fff', textColor: '#ec4238' },
  { file: 'mf11_nerdy-things-cartoon-character-vol-1-uno-cards.svg', bgColor: '#fff', textColor: '#ff3342' },

  // Sports Characters
  { file: 'mf2_sports-character-cartoon-vol-01-happy-basketball.svg', bgColor: '#fff', textColor: '#f26529' },
  { file: 'mf30_sports-character-cartoon-vol-03-punch-glove.svg', bgColor: '#fff', textColor: '#e94034' },
  { file: 'mf30_sports-character-cartoon-vol-03-swim-glass.svg', bgColor: '#fff', textColor: '#43aadd' },

  // Sports Badges
  { file: 'mf14_retro-cartoon-sport-logo-badges-running-club.svg', bgColor: '#ede9e0', textColor: '#1565ad' },
  { file: 'mf14_retro-cartoon-sport-logo-badges-basketball.svg', bgColor: '#ede9e0', textColor: '#f37527' },
  { file: 'mf14_retro-cartoon-sport-logo-badges-racing-team.svg', bgColor: '#ede9e0', textColor: '#ec4238' },

  // Music Badge
  { file: 'mf15_retro-cartoon-music-world-logo-badges.svg', bgColor: '#f6eadf', textColor: '#009fd1' },

  // Transport & Eco Badges
  { file: 'mf3_retro-logo-badges-transport-&-travel.svg', bgColor: '#7ad1ee', textColor: '#ec5728' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-electronic-vehicle.svg', bgColor: '#ede9e0', textColor: '#1fb256' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-earth.svg', bgColor: '#ede9e0', textColor: '#1fb256' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-cycling.svg', bgColor: '#ede9e0', textColor: '#ee3a24' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-reusable-bag.svg', bgColor: '#ede9e0', textColor: '#4183c4' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-solar-panel.svg', bgColor: '#ede9e0', textColor: '#f6d324' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-tumbler.svg', bgColor: '#ede9e0', textColor: '#ee3a24' },

  // Summer Characters
  { file: 'mf24_summer-cartoon-character-vol-01-flamingo.svg', bgColor: '#fff2d9', textColor: '#eb6f93' },
  { file: 'mf24_summer-cartoon-character-vol-01-smile-watermelon.svg', bgColor: '#fff', textColor: '#44cdf2' },
  { file: 'mf24_summer-cartoon-character-vol-01-sunglasses.svg', bgColor: '#fff', textColor: '#ff8db6' },

  // Spring Characters
  { file: 'mf32_spring-cartoon-character-curious-tomato.svg', bgColor: '#fff', textColor: '#fe87e3' },
  { file: 'mf32_spring-cartoon-character-happy-sweater.svg', bgColor: '#fff', textColor: '#fe87e3' },
  { file: 'mf32_spring-cartoon-character-picnic-basket.svg', bgColor: '#fff', textColor: '#458c28' },

  // Autumn Character
  { file: 'mf20_autumn-character-badge-smiley-pumpkin.svg', bgColor: '#fff', textColor: '#c30706' },

  // Winter Characters
  { file: 'mf5_winter-character-badge-gift-box.svg', bgColor: '#fff', textColor: '#e93b3e' },
  { file: 'mf5_winter-character-badge-polkadot-mug.svg', bgColor: '#fff', textColor: '#2d52a2' },

  // New Year
  { file: 'mf25_new-year-badge-vol-3-cute-crown.svg', bgColor: '#fff', textColor: '#e63f3e' },
  { file: 'mf25_new-year-badge-vol-3-pinky-bow.svg', bgColor: '#fff', textColor: '#ffbf31' },

  // Services & Vintage Badges
  { file: 'mf3_retro-logo-badges-health-care.svg', bgColor: '#7ad1ee', textColor: '#ec5728' },
  { file: 'mf3_retro-logo-badges-architecture.svg', bgColor: '#e7e226', textColor: '#3356a7' },
  { file: 'mf3_retro-logo-badges-coffee-shop.svg', bgColor: '#3356a7', textColor: '#f7b917' },
  { file: 'mf9_vintage-logo-badges-barbershop.svg', bgColor: '#f5d30d', textColor: '#7b64ac' },
  { file: 'mf9_vintage-logo-badges-motorcycle.svg', bgColor: '#8063ab', textColor: '#fddb00' },
  { file: 'mf8_vintage-logo-badges-pest-control.svg', bgColor: '#759b3e', textColor: '#f2e9df' },
  { file: 'mf8_vintage-logo-badges-financial-planner.svg', bgColor: '#36803d', textColor: '#f7b917' },
  { file: 'mf8_vintage-logo-badges-laundry.svg', bgColor: '#76b3e2', textColor: '#dd4825' },
  { file: 'mf29_vintage-logo-badges-ghost.svg', bgColor: '#3f110f', textColor: '#dc9fc7' },
  { file: 'mf29_vintage-logo-badges-skeleton.svg', bgColor: '#3f110f', textColor: '#2a9c59' },

  // Travel
  { file: 'mf34_authentic-india-badge-vol-3-traditional-travel.svg', bgColor: '#fff', textColor: '#f484cc' },
]

// Convert hex to RGB for color distance calculation
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    // Handle shorthand like #fff
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex)
    if (!short) return null
    return {
      r: parseInt(short[1] + short[1], 16),
      g: parseInt(short[2] + short[2], 16),
      b: parseInt(short[3] + short[3], 16),
    }
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

// Check if two colors are similar (to avoid jarring same-color transitions)
// Returns Euclidean distance in RGB space
export function colorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)
  if (!rgb1 || !rgb2) return 999
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  )
}

// Get a random sticker that has sufficient color distance from the current one
export function getRandomSticker(currentIndex: number, minColorDistance = 80): Sticker {
  const currentColor = STICKERS[currentIndex].textColor

  let newIndex = currentIndex
  let attempts = 0
  while (attempts < 20) {
    newIndex = Math.floor(Math.random() * STICKERS.length)
    if (newIndex !== currentIndex) {
      const newColor = STICKERS[newIndex].textColor
      if (colorDistance(currentColor, newColor) > minColorDistance) {
        break
      }
    }
    attempts++
  }

  // Fallback: just pick any different index if we couldn't find a good color
  if (newIndex === currentIndex) {
    newIndex = (currentIndex + 1) % STICKERS.length
  }

  return STICKERS[newIndex]
}
