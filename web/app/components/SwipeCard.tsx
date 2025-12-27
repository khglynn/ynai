'use client'

import { forwardRef, useImperativeHandle } from 'react'
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { TransactionCard, SwipeDirection } from '../types/transaction'
import { TransactionContent } from './TransactionContent'
import { StampOverlay } from './StampOverlay'

const SWIPE_THRESHOLD = 100 // pixels to commit swipe
const VELOCITY_THRESHOLD = 500 // velocity to trigger swipe

// Stack styling for cards behind the top card
const STACK_CONFIG = [
  { scale: 1, y: 0, rotate: 0 },           // Top card
  { scale: 0.95, y: 20, rotate: 4 },       // Second card (more visible offset)
  { scale: 0.90, y: 40, rotate: -3 },      // Third card
]

// Generate a consistent random rotation for a card based on its ID
function getCardRotation(cardId: string): number {
  // Simple hash to get consistent "random" rotation per card
  let hash = 0
  for (let i = 0; i < cardId.length; i++) {
    hash = ((hash << 5) - hash) + cardId.charCodeAt(i)
    hash = hash & hash
  }
  // Return rotation between -2 and 2 degrees
  return (hash % 5) - 2
}

interface SwipeCardProps {
  card: TransactionCard
  isTop: boolean
  stackIndex: number
  onSwipe: (card: TransactionCard, direction: SwipeDirection) => void
}

export interface SwipeCardRef {
  swipe: (direction: SwipeDirection) => Promise<void>
}

export const SwipeCard = forwardRef<SwipeCardRef, SwipeCardProps>(
  function SwipeCard({ card, isTop, stackIndex, onSwipe }, ref) {
    const x = useMotionValue(0)
    const controls = useAnimation()

    // Get stack styling for this card position
    const stackStyle = STACK_CONFIG[stackIndex] || STACK_CONFIG[STACK_CONFIG.length - 1]

    // Add card-specific rotation for "tossed on table" feel
    const cardRotation = getCardRotation(card.id)

    // Rotation: tilt as card is dragged (max ±15 degrees)
    const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15])

    // Stamp opacities: fade in as card approaches threshold
    const approvedOpacity = useTransform(x, [0, 80, SWIPE_THRESHOLD], [0, 0, 1])
    const laterOpacity = useTransform(x, [-SWIPE_THRESHOLD, -80, 0], [1, 0, 0])

    // Card opacity: slight fade as it leaves screen
    const cardOpacity = useTransform(
      x,
      [-300, -200, 0, 200, 300],
      [0.5, 1, 1, 1, 0.5]
    )

    // Handle swipe programmatically (for desktop buttons)
    const swipe = async (direction: SwipeDirection) => {
      const xTarget = direction === 'approved' ? 500 : -500
      await controls.start({
        x: xTarget,
        opacity: 0,
        transition: { duration: 0.3, ease: 'easeOut' },
      })
      onSwipe(card, direction)
    }

    // Expose swipe method to parent via ref
    useImperativeHandle(ref, () => ({ swipe }))

    // Handle drag end
    const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x
      const velocity = info.velocity.x

      // Swipe right = approved
      if (offset > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        swipe('approved')
        return
      }

      // Swipe left = later
      if (offset < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD) {
        swipe('later')
        return
      }

      // Snap back to center
      controls.start({
        x: 0,
        transition: { type: 'spring', stiffness: 500, damping: 30 },
      })
    }

    return (
      <motion.div
        drag={isTop ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={isTop ? onDragEnd : undefined}
        animate={controls}
        initial={{
          scale: stackStyle.scale,
          y: stackStyle.y,
          rotate: stackStyle.rotate + cardRotation,
        }}
        style={{
          x: isTop ? x : 0,
          rotate: isTop ? rotate : stackStyle.rotate,
          opacity: isTop ? cardOpacity : 1,
          zIndex: 10 - stackIndex,
          backgroundColor: card.sticker.bgColor,
        }}
        exit={{
          x: x.get() > 0 ? 500 : -500,
          opacity: 0,
          transition: { duration: 0.3 },
        }}
        className={`
          absolute
          w-[320px] h-[min(520px,75vh)]
          md:w-[400px] md:h-[min(640px,80vh)]
          rounded-3xl
          card-edge
          overflow-hidden
          ${isTop ? 'card-shadow-top cursor-grab active:cursor-grabbing swipe-card' : 'card-shadow'}
        `}
      >
        <TransactionContent card={card} />

        {/* Stamp overlays - only on top card */}
        {isTop && (
          <>
            <StampOverlay type="approved" opacity={approvedOpacity} />
            <StampOverlay type="later" opacity={laterOpacity} />
          </>
        )}
      </motion.div>
    )
  }
)
