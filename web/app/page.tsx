'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const STICKERS = [
  'mf7_food-retro-cartoon-vol-01-surprised-pizza.svg',
  'mf7_food-retro-cartoon-vol-01-funny-sandwich.svg',
  'mf7_food-retro-cartoon-vol-01-happy-doughnut.svg',
  'mf16_food-retro-cartoon-vol-02-angry-sushi.svg',
  'mf16_food-retro-cartoon-vol-02-honey-pancake.svg',
  'mf33_retro-cartoon-ice-cream-logo-badges-ice-cream-cone.svg',
  'mf4_shopping-character-vol-01-shopping-cart.svg',
  'mf4_shopping-character-vol-01-funny-box.svg',
  'mf13_nerdy-things-cartoon-vol-3-floppy-disk.svg',
  'mf13_nerdy-things-cartoon-vol-3-retro-phone.svg',
  'mf11_nerdy-things-cartoon-character-vol-1-cute-game-watch.svg',
  'mf14_retro-cartoon-sport-logo-badges-running-club.svg',
  'mf2_sports-character-cartoon-vol-01-happy-basketball.svg',
  'mf30_sports-character-cartoon-vol-03-punch-glove.svg',
  'mf3_retro-logo-badges-transport-&-travel.svg',
  'mf22_retro-cartoon-eco-friendly-logo-badges-electronic-vehicle.svg',
  'mf24_summer-cartoon-character-vol-01-flamingo.svg',
  'mf5_winter-character-badge-gift-box.svg',
  'mf25_new-year-badge-vol-3-cute-crown.svg',
  'mf3_retro-logo-badges-health-care.svg',
  'mf9_vintage-logo-badges-barbershop.svg',
  'mf22_retro-cartoon-eco-friendly-logo-badges-earth.svg',
  'mf29_vintage-logo-badges-ghost.svg',
  'mf8_vintage-logo-badges-pest-control.svg',
  'mf3_retro-logo-badges-architecture.svg',
  'mf9_vintage-logo-badges-motorcycle.svg',
]

const COLORS = [
  { bg: 'bg-retro-teal', name: 'teal' },
  { bg: 'bg-retro-coral', name: 'coral' },
  { bg: 'bg-retro-mustard', name: 'mustard' },
  { bg: 'bg-retro-pink', name: 'pink' },
  { bg: 'bg-retro-green', name: 'green' },
]

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [colorIndex, setColorIndex] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const shuffle = () => {
    let newIndex = currentIndex
    while (newIndex === currentIndex) {
      newIndex = Math.floor(Math.random() * STICKERS.length)
    }
    setCurrentIndex(newIndex)
    setColorIndex((prev) => (prev + 1) % COLORS.length)
    setAnimKey((prev) => prev + 1)
  }

  return (
    <main className={`min-h-screen ${COLORS[colorIndex].bg} transition-colors duration-500 flex flex-col items-center justify-center p-8 relative overflow-hidden`}>
      {/* Paper texture overlay */}
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      {/* Title */}
      <h1 className="font-display text-4xl md:text-6xl text-retro-cream mb-2 drop-shadow-lg relative z-10">
        ynai
      </h1>
      <p className="text-retro-cream/80 text-lg mb-12 relative z-10">
        your new ai budgeting buddy
      </p>

      {/* Sticker display */}
      <div
        key={animKey}
        className="animate-bounce-in relative z-10 mb-12"
      >
        <div className="w-64 h-64 md:w-80 md:h-80 relative drop-shadow-2xl">
          <Image
            src={`/stickers/selected/${STICKERS[currentIndex]}`}
            alt="Sticker"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Button */}
      <button
        onClick={shuffle}
        className="relative z-10 bg-retro-cream text-retro-charcoal font-display text-2xl md:text-3xl px-10 py-4 rounded-full border-4 border-retro-charcoal shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150"
      >
        another one
      </button>

      {/* Counter */}
      <p className="text-retro-cream/60 mt-8 text-sm relative z-10">
        {currentIndex + 1} of {STICKERS.length} stickers
      </p>
    </main>
  )
}
