'use client'

import { useState } from 'react'
import { Transaction } from '../types/transaction'

interface BulkApprovalListProps {
  transactions: Transaction[]
  onApprove: (approvedIds: string[], skippedIds: string[]) => void
}

export function BulkApprovalList({ transactions, onApprove }: BulkApprovalListProps) {
  // Track which items are opted out (will go to swipe stack)
  const [optedOut, setOptedOut] = useState<Set<string>>(new Set())

  const toggleOptOut = (id: string) => {
    setOptedOut(prev => {
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
      .filter(t => !optedOut.has(t.id))
      .map(t => t.id)
    const skippedIds = Array.from(optedOut)
    onApprove(approvedIds, skippedIds)
  }

  const approveCount = transactions.length - optedOut.size

  return (
    <div className="h-full w-full flex items-center justify-center relative">
      {/* Container for the card-framed layout */}
      <div className="relative w-full max-w-lg h-[600px] md:h-[700px] mx-4">

        {/* Top card - Header */}
        <div className="
          absolute top-0 left-0 right-0 z-20
          bg-amber-400
          rounded-2xl
          shadow-lg
          px-6 py-5
          text-center
        ">
          <h1 className="text-2xl md:text-3xl font-bold text-amber-900">
            Quick Review
          </h1>
          <p className="text-amber-800 text-sm mt-1">
            {transactions.length} transactions · uncheck to review manually
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
            {transactions.map(t => (
              <div
                key={t.id}
                onClick={() => toggleOptOut(t.id)}
                className={`
                  flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all
                  ${optedOut.has(t.id)
                    ? 'bg-gray-200 opacity-60'
                    : 'bg-white shadow-md hover:shadow-lg'
                  }
                `}
              >
                {/* Checkbox */}
                <div className={`
                  w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0
                  ${optedOut.has(t.id)
                    ? 'border-gray-300 bg-gray-100'
                    : 'border-green-500 bg-green-500'
                  }
                `}>
                  {!optedOut.has(t.id) && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Transaction info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 truncate">{t.payee}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                      {Math.round(t.confidence * 100)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {t.suggestedCategory}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-800">
                    ${t.amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
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
            className="
              w-full px-6 py-5
              text-white font-bold text-lg md:text-xl
              hover:bg-green-600
              transition-colors
              active:scale-[0.98]
            "
          >
            Looks Good! ({approveCount})
          </button>

          {optedOut.size > 0 && (
            <div className="bg-green-600 px-6 py-2 text-green-100 text-sm text-center">
              {optedOut.size} will go to manual review
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
