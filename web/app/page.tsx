'use client'

import { useState, useMemo } from 'react'
import { CardStack } from './components/CardStack'
import { BulkApprovalList } from './components/BulkApprovalList'
import { FAKE_TRANSACTIONS, Transaction } from './types/transaction'

const HIGH_CONFIDENCE_THRESHOLD = 0.80

type AppPhase = 'bulk' | 'swipe' | 'done'

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>('bulk')
  const [bulkApprovedIds, setBulkApprovedIds] = useState<string[]>([])
  const [swipeResults, setSwipeResults] = useState<{ approved: number; deferred: number }>({
    approved: 0,
    deferred: 0,
  })

  // Split transactions by confidence
  const { highConfidence, lowConfidence } = useMemo(() => {
    const high: Transaction[] = []
    const low: Transaction[] = []

    FAKE_TRANSACTIONS.forEach(t => {
      if (t.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
        high.push(t)
      } else {
        low.push(t)
      }
    })

    return { highConfidence: high, lowConfidence: low }
  }, [])

  // Transactions for swipe stack (after bulk approval)
  const [swipeTransactions, setSwipeTransactions] = useState<Transaction[]>([])

  const handleBulkApprove = (approvedIds: string[], skippedIds: string[]) => {
    setBulkApprovedIds(approvedIds)

    // Swipe stack gets: skipped high-confidence + all low-confidence
    const skippedHighConfidence = highConfidence.filter(t => skippedIds.includes(t.id))
    const swipeStack = [...skippedHighConfidence, ...lowConfidence]

    setSwipeTransactions(swipeStack)

    if (swipeStack.length > 0) {
      setPhase('swipe')
    } else {
      // No manual review needed
      setPhase('done')
    }
  }

  const handleSwipeComplete = (approved: number, deferred: number) => {
    setSwipeResults({ approved, deferred })
    setPhase('done')
  }

  const handleStartOver = () => {
    setPhase('bulk')
    setBulkApprovedIds([])
    setSwipeTransactions([])
    setSwipeResults({ approved: 0, deferred: 0 })
  }

  return (
    <main className="h-screen w-screen relative overflow-hidden bg-gray-100">
      {/* Paper texture overlay - on top of everything */}
      <div className="absolute inset-0 paper-texture pointer-events-none z-50" />

      {/* Bulk approval phase */}
      {phase === 'bulk' && (
        <BulkApprovalList
          transactions={highConfidence}
          onApprove={handleBulkApprove}
        />
      )}

      {/* Swipe stack phase */}
      {phase === 'swipe' && (
        <CardStack
          transactions={swipeTransactions}
          onComplete={handleSwipeComplete}
        />
      )}

      {/* Completion phase */}
      {phase === 'done' && (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <h2 className="text-3xl font-bold text-gray-800">All done!</h2>

          <div className="text-center text-gray-600 space-y-1">
            <p className="text-lg">
              <span className="font-semibold text-green-600">{bulkApprovedIds.length}</span> bulk approved
            </p>
            {swipeResults.approved > 0 && (
              <p>
                <span className="font-semibold text-green-600">{swipeResults.approved}</span> manually approved
              </p>
            )}
            {swipeResults.deferred > 0 && (
              <p>
                <span className="font-semibold text-amber-600">{swipeResults.deferred}</span> deferred
              </p>
            )}
          </div>

          <button
            onClick={handleStartOver}
            className="mt-4 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </main>
  )
}
