'use client'

import { SwipeDirection } from '../types/transaction'

interface SwipeButtonsProps {
  onSwipe: (direction: SwipeDirection) => void
  disabled?: boolean
}

export function SwipeButtons({ onSwipe, disabled }: SwipeButtonsProps) {
  return (
    <>
      {/* Left button - Later (amber) */}
      <button
        onClick={() => onSwipe('later')}
        disabled={disabled}
        className="
          hidden md:flex
          absolute left-4 lg:left-8
          top-1/2 -translate-y-1/2
          flex-col items-center justify-center gap-3
          w-20 lg:w-24 h-[520px] lg:h-[640px]
          bg-amber-400 hover:bg-amber-500
          rounded-2xl
          text-amber-900
          font-display font-bold
          shadow-lg
          transition-all duration-150
          hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          z-5
        "
        aria-label="Skip for later"
      >
        <span className="text-4xl lg:text-5xl">←</span>
        <span className="text-sm lg:text-base uppercase tracking-wide writing-vertical">
          Later
        </span>
      </button>

      {/* Right button - Approved (green) */}
      <button
        onClick={() => onSwipe('approved')}
        disabled={disabled}
        className="
          hidden md:flex
          absolute right-4 lg:right-8
          top-1/2 -translate-y-1/2
          flex-col items-center justify-center gap-3
          w-20 lg:w-24 h-[520px] lg:h-[640px]
          bg-green-500 hover:bg-green-600
          rounded-2xl
          text-white
          font-display font-bold
          shadow-lg
          transition-all duration-150
          hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          z-5
        "
        aria-label="Approve categorization"
      >
        <span className="text-4xl lg:text-5xl">→</span>
        <span className="text-sm lg:text-base uppercase tracking-wide writing-vertical">
          Yes
        </span>
      </button>
    </>
  )
}
