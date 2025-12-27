'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Transaction } from '../types/transaction'

interface BulkApprovalListProps {
  transactions: Transaction[]
  onApprove: (approvedIds: string[], skippedIds: string[]) => void
}

export function BulkApprovalList({ transactions, onApprove }: BulkApprovalListProps) {
  const [checked, setChecked] = useState<Set<string>>(
    new Set(transactions.map(t => t.id))
  )

  const toggleItem = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleApprove = () => {
    const approvedIds = transactions
      .filter(t => checked.has(t.id))
      .map(t => t.id)
    const skippedIds = transactions
      .filter(t => !checked.has(t.id))
      .map(t => t.id)
    onApprove(approvedIds, skippedIds)
  }

  const approveCount = checked.size
  const skippedCount = transactions.length - checked.size

  return (
    <div className="h-full w-full flex items-center justify-center relative">
      {/* Container for the card-framed layout - vh-based for small viewports */}
      <div className="relative w-full max-w-lg h-[min(600px,85vh)] md:h-[min(700px,90vh)] mx-4">

        {/* Top card - Header */}
        <div className="
          absolute top-0 left-0 right-0 z-20
          bg-amber-400
          rounded-2xl
          shadow-lg
          px-6 py-5
          text-center
        ">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-amber-900">
            These good to approve?
          </h1>
          <p className="text-amber-800 mt-1 text-sm">
            {approveCount} of {transactions.length} selected
          </p>
        </div>

        {/* Scrollable transaction list - goes behind the cards */}
        <div className="
          absolute inset-0
          overflow-y-auto
          px-2
          z-10
        ">
          {/* Top spacer - pushes content below the header card */}
          <div className="h-[108px]" />

          <div className="space-y-2">
            {transactions.map((t, index) => {
              const isChecked = checked.has(t.id)
              return (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => toggleItem(t.id)}
                  className={`
                    group w-full flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all
                    ${isChecked
                      ? 'bg-white shadow-md hover:shadow-lg'
                      : 'bg-gray-200 opacity-60'
                    }
                  `}
                >
                  {/* Checkbox */}
                  <div className={`
                    w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0
                    ${isChecked
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300 bg-gray-100'
                    }
                  `}>
                    {isChecked && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Transaction info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 truncate">{t.payee}</span>
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {Math.round(t.confidence * 100)}%
                      </span>
                    </div>
                    <div className="text-sm text-green-700 font-medium">
                      {t.suggestedCategory}
                    </div>
                  </div>

                  {/* Amount + Date */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-gray-800">
                      ${t.amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Bottom spacer - pushes content above the footer card */}
          <div className="h-[108px]" />
        </div>

        {/* Bottom card - Approve button */}
        <div className="
          absolute bottom-0 left-0 right-0 z-20
          bg-green-500
          rounded-2xl
          shadow-lg
          overflow-hidden
        ">
          <button
            onClick={handleApprove}
            disabled={approveCount === 0}
            className="
              w-full px-6 py-5
              text-white font-display font-bold text-lg md:text-xl uppercase tracking-wide
              hover:bg-green-600
              transition-colors
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {approveCount > 0
              ? `Approve ${approveCount} →`
              : 'Nothing selected'
            }
          </button>

          {skippedCount > 0 && approveCount > 0 && (
            <div className="bg-green-600 px-6 py-2 text-green-100 text-sm text-center">
              {skippedCount} will go to card review
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
