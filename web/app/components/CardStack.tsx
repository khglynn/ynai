'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { STICKERS, colorDistance } from '../lib/stickers'
import { TransactionCard, SwipeDirection, SwipeResult, Transaction } from '../types/transaction'
import { SwipeCard, SwipeCardRef } from './SwipeCard'
import { SwipeButtons } from './SwipeButtons'

// Assign stickers to transactions, avoiding similar consecutive colors
function assignStickersToTransactions(transactions: Transaction[]): TransactionCard[] {
  const cards: TransactionCard[] = []
  let lastStickerIndex = -1

  for (const tx of transactions) {
    let stickerIndex = Math.floor(Math.random() * STICKERS.length)
    let attempts = 0

    // Try to find a sticker with sufficient color distance from the last one
    while (attempts < 20 && lastStickerIndex >= 0) {
      const lastColor = STICKERS[lastStickerIndex].textColor
      const newColor = STICKERS[stickerIndex].textColor

      if (colorDistance(lastColor, newColor) > 80) {
        break
      }

      stickerIndex = Math.floor(Math.random() * STICKERS.length)
      attempts++
    }

    cards.push({
      ...tx,
      sticker: STICKERS[stickerIndex],
    })

    lastStickerIndex = stickerIndex
  }

  return cards
}

interface CardStackProps {
  transactions: Transaction[]
  onComplete: (approved: number, deferred: number) => void
}

export function CardStack({ transactions, onComplete }: CardStackProps) {
  const [cards, setCards] = useState<TransactionCard[]>([])
  const [history, setHistory] = useState<SwipeResult[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  // Ref to the top card for programmatic swiping
  const topCardRef = useRef<SwipeCardRef>(null)

  // Initialize cards when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      const initialCards = assignStickersToTransactions(transactions)
      setCards(initialCards)
      setHistory([])
    }
  }, [transactions])

  // Handle swipe completion
  const handleSwipe = useCallback((card: TransactionCard, direction: SwipeDirection) => {
    // Add to history (for potential undo)
    const newHistory = [...history, {
      transaction: card,
      direction,
      timestamp: new Date(),
    }]
    setHistory(newHistory)

    // Remove from cards
    const remainingCards = cards.filter(c => c.id !== card.id)
    setCards(remainingCards)

    // Log for now (will integrate with YNAB later)
    console.log(`${direction.toUpperCase()}: ${card.payee} - $${card.amount.toFixed(2)} → ${card.suggestedCategory}`)

    setIsAnimating(false)

    // Check if we're done
    if (remainingCards.length === 0) {
      const approved = newHistory.filter(h => h.direction === 'approved').length
      const deferred = newHistory.filter(h => h.direction === 'later').length
      onComplete(approved, deferred)
    }
  }, [cards, history, onComplete])

  // Handle button click (desktop)
  const handleButtonSwipe = useCallback(async (direction: SwipeDirection) => {
    if (isAnimating || cards.length === 0 || !topCardRef.current) return

    setIsAnimating(true)
    await topCardRef.current.swipe(direction)
  }, [isAnimating, cards.length])

  // Get visible cards (top 3)
  const visibleCards = cards.slice(0, 3)

  // Empty state (shouldn't normally show - onComplete handles transition)
  if (cards.length === 0) {
    return null
  }

  return (
    <div className="h-full w-full flex items-center justify-center relative">
      {/* Card stack */}
      <div className="relative flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((card, index) => (
            <SwipeCard
              key={card.id}
              ref={index === 0 ? topCardRef : null}
              card={card}
              isTop={index === 0}
              stackIndex={index}
              onSwipe={handleSwipe}
            />
          )).reverse() /* Reverse so top card renders last (on top) */}
        </AnimatePresence>
      </div>

      {/* Desktop action buttons (hidden on mobile) */}
      <SwipeButtons
        onSwipe={handleButtonSwipe}
        disabled={isAnimating || cards.length === 0}
      />

      {/* Progress indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-gray-500 font-medium">
        {cards.length} remaining
      </div>
    </div>
  )
}
