'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TransactionCard, CategorySuggestion } from '../types/transaction'
import { CategoryPicker } from './CategoryPicker'

interface TransactionContentProps {
  card: TransactionCard
  onCategoryChange?: (category: CategorySuggestion) => void
}

export function TransactionContent({ card, onCategoryChange }: TransactionContentProps) {
  const { payee, amount, date, suggestedCategory, confidence, sticker } = card
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(suggestedCategory)

  // Format date nicely
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  // Handle category selection from picker
  const handleCategorySelect = (category: CategorySuggestion) => {
    setSelectedCategory(category.name)
    onCategoryChange?.(category)
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Sticker - floats to top of card, sized to not overlap text */}
      <div className="absolute inset-x-0 top-0 bottom-[45%] flex items-start justify-center pointer-events-none">
        <div className="relative w-full h-full">
          <Image
            src={`/stickers/selected/${sticker.file}`}
            alt=""
            fill
            className="object-contain object-top"
            priority
          />
        </div>
      </div>

      {/* Transaction info - gradient overlay at bottom for readability */}
      <div
        className="absolute inset-x-0 bottom-0 px-4 pb-6 pt-12 text-center"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, ${sticker.bgColor}80 30%, ${sticker.bgColor} 50%)`,
        }}
      >
        {/* Amount - top, readable */}
        <div
          className="font-semibold text-base"
          style={{ color: sticker.textColor }}
        >
          ${amount.toFixed(2)}
        </div>

        {/* Payee - hero */}
        <div
          className="text-2xl md:text-3xl font-bold mt-1"
          style={{ color: sticker.textColor }}
        >
          {payee}
        </div>

        {/* Category - tappable button */}
        <button
          onClick={() => setIsPickerOpen(true)}
          className="mt-3 py-2.5 px-6 rounded-xl text-base md:text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          style={{
            backgroundColor: sticker.textColor,
            color: 'white',
          }}
        >
          {selectedCategory}
          <span className="ml-2 opacity-70 text-sm">▼</span>
        </button>

        {/* Date - readable */}
        <div
          className="text-base font-medium mt-2"
          style={{ color: sticker.textColor }}
        >
          {formattedDate}
        </div>
      </div>

      {/* Category picker */}
      <CategoryPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleCategorySelect}
        suggestedCategory={suggestedCategory}
        suggestedConfidence={confidence}
        colors={{
          bgColor: sticker.bgColor,
          textColor: sticker.textColor,
        }}
      />
    </div>
  )
}
