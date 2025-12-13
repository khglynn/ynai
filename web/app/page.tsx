'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

// Stickers with their background colors extracted from SVGs
const STICKERS: { file: string; bgColor: string }[] = [
  // Food - red/orange backgrounds
  { file: 'mf7_food-retro-cartoon-vol-01-surprised-pizza.svg', bgColor: '#e0330b' },
  { file: 'mf7_food-retro-cartoon-vol-01-funny-sandwich.svg', bgColor: '#fc480d' },
  { file: 'mf7_food-retro-cartoon-vol-01-happy-doughnut.svg', bgColor: '#e8846b' },
  { file: 'mf16_food-retro-cartoon-vol-02-angry-sushi.svg', bgColor: '#2d7a7a' },
  { file: 'mf16_food-retro-cartoon-vol-02-honey-pancake.svg', bgColor: '#d4a84b' },
  { file: 'mf33_retro-cartoon-ice-cream-logo-badges-ice-cream-cone.svg', bgColor: '#e8b4b4' },

  // Shopping - yellow/teal
  { file: 'mf4_shopping-character-vol-01-shopping-cart.svg', bgColor: '#ffe67d' },
  { file: 'mf4_shopping-character-vol-01-funny-box.svg', bgColor: '#fc480d' },

  // Tech - blue/teal
  { file: 'mf13_nerdy-things-cartoon-vol-3-floppy-disk.svg', bgColor: '#2d7a7a' },
  { file: 'mf13_nerdy-things-cartoon-vol-3-retro-phone.svg', bgColor: '#e8846b' },
  { file: 'mf11_nerdy-things-cartoon-character-vol-1-cute-game-watch.svg', bgColor: '#ffe67d' },

  // Sports - various
  { file: 'mf14_retro-cartoon-sport-logo-badges-running-club.svg', bgColor: '#d4a84b' },
  { file: 'mf2_sports-character-cartoon-vol-01-happy-basketball.svg', bgColor: '#fc480d' },
  { file: 'mf30_sports-character-cartoon-vol-03-punch-glove.svg', bgColor: '#e0330b' },

  // Transport - teal/green
  { file: 'mf3_retro-logo-badges-transport-&-travel.svg', bgColor: '#4a7c59' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-electronic-vehicle.svg', bgColor: '#2d7a7a' },

  // Seasonal
  { file: 'mf24_summer-cartoon-character-vol-01-flamingo.svg', bgColor: '#e8b4b4' },
  { file: 'mf5_winter-character-badge-gift-box.svg', bgColor: '#ffe67d' },
  { file: 'mf25_new-year-badge-vol-3-cute-crown.svg', bgColor: '#d4a84b' },

  // Services - various
  { file: 'mf3_retro-logo-badges-health-care.svg', bgColor: '#2d7a7a' },
  { file: 'mf9_vintage-logo-badges-barbershop.svg', bgColor: '#e8846b' },
  { file: 'mf22_retro-cartoon-eco-friendly-logo-badges-earth.svg', bgColor: '#4a7c59' },
  { file: 'mf29_vintage-logo-badges-ghost.svg', bgColor: '#3d3d3d' },
  { file: 'mf8_vintage-logo-badges-pest-control.svg', bgColor: '#d4a84b' },
  { file: 'mf3_retro-logo-badges-architecture.svg', bgColor: '#2d7a7a' },
  { file: 'mf9_vintage-logo-badges-motorcycle.svg', bgColor: '#fc480d' },
]

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null)
  const [isEntering, setIsEntering] = useState(false)

  const shuffle = useCallback(() => {
    if (outgoingIndex !== null) return // Already animating

    // Pick next sticker (different from current)
    let newIndex = currentIndex
    while (newIndex === currentIndex) {
      newIndex = Math.floor(Math.random() * STICKERS.length)
    }

    // Old sticker becomes outgoing, new sticker becomes current
    setOutgoingIndex(currentIndex)
    setCurrentIndex(newIndex)
    setIsEntering(true)

    // Clear outgoing after it slides out
    setTimeout(() => {
      setOutgoingIndex(null)
    }, 350)

    // Clear entering state after slide-in completes
    setTimeout(() => {
      setIsEntering(false)
    }, 450)
  }, [currentIndex, outgoingIndex])

  const currentSticker = STICKERS[currentIndex]
  const outgoingSticker = outgoingIndex !== null ? STICKERS[outgoingIndex] : null

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: currentSticker.bgColor }}
    >
      {/* Paper texture overlay */}
      <div className="absolute inset-0 paper-texture pointer-events-none z-50" />

      {/* Centered container with overlapping elements */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Title - overlaps top of sticker */}
        <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-retro-charcoal drop-shadow-lg relative z-20 tracking-tight mb-[-2rem] md:mb-[-3rem] lg:mb-[-4rem]">
          ynai
        </h1>

        {/* Sticker display - container for both current and outgoing */}
        <div className="relative z-10 w-[70vw] h-[70vw] max-w-[500px] max-h-[500px] md:max-w-[600px] md:max-h-[600px]">
          {/* Outgoing sticker - slides out left */}
          {outgoingSticker && (
            <div
              className="absolute inset-0 animate-slide-out"
              style={{ backgroundColor: outgoingSticker.bgColor }}
            >
              <div className="relative w-full h-full">
                <Image
                  src={`/stickers/selected/${outgoingSticker.file}`}
                  alt="Sticker"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Current sticker - slides in from right when entering */}
          <div
            className={`absolute inset-0 ${isEntering ? 'animate-slide-in' : ''}`}
            style={{ backgroundColor: currentSticker.bgColor }}
          >
            <div className="relative w-full h-full">
              <Image
                src={`/stickers/selected/${currentSticker.file}`}
                alt="Sticker"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Button - overlaps bottom of sticker */}
        <button
          onClick={shuffle}
          disabled={outgoingIndex !== null}
          className="relative z-20 mt-[-2rem] md:mt-[-3rem] lg:mt-[-4rem] bg-retro-charcoal text-retro-cream font-display text-2xl md:text-3xl lg:text-4xl px-10 py-4 rounded-full border-4 border-retro-charcoal shadow-lg hover:scale-105 active:scale-95 transition-transform duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          another one
        </button>
      </div>
    </main>
  )
}
