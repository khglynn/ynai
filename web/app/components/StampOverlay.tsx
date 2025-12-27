'use client'

import { motion, MotionValue } from 'framer-motion'

interface StampOverlayProps {
  type: 'approved' | 'later'
  opacity: MotionValue<number>
}

export function StampOverlay({ type, opacity }: StampOverlayProps) {
  const isApproved = type === 'approved'

  return (
    <motion.div
      className={`
        absolute top-6 ${isApproved ? 'right-4' : 'left-4'}
        px-4 py-2
        border-4 rounded-lg
        font-display text-xl md:text-2xl font-bold
        uppercase tracking-wider
        ${isApproved ? 'rotate-12' : '-rotate-12'}
        pointer-events-none
        ${isApproved
          ? 'border-green-600 text-green-600'
          : 'border-amber-500 text-amber-500'
        }
      `}
      style={{
        opacity,
        // Vintage stamp effect with double border illusion
        boxShadow: `
          inset 0 0 0 2px ${isApproved ? 'rgba(22, 163, 74, 0.3)' : 'rgba(245, 158, 11, 0.3)'}
        `,
      }}
    >
      <span className="stamp-texture relative">
        {isApproved ? 'Approved' : 'Later'}
      </span>
    </motion.div>
  )
}
