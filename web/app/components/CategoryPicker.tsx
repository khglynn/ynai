'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CategorySuggestion } from '../types/transaction'
import { getMockAlternatives, getAllCategories } from '../lib/mockCategories'

interface CategoryPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (category: CategorySuggestion) => void
  suggestedCategory: string
  suggestedConfidence: number
  colors: {
    bgColor: string
    textColor: string
  }
}

export function CategoryPicker({
  isOpen,
  onClose,
  onSelect,
  suggestedCategory,
  suggestedConfidence,
  colors,
}: CategoryPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Mount portal after initial render (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get categories - suggestions when collapsed, all when searching
  const suggestions = getMockAlternatives(suggestedCategory, suggestedConfidence)
  const allCategories = getAllCategories()

  // Filter categories based on search
  const displayedCategories = searchQuery
    ? allCategories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.groupName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : isExpanded
    ? [...suggestions, ...allCategories.filter(
        (cat) => !suggestions.some((s) => s.name === cat.name)
      )]
    : suggestions.slice(0, 5)

  // Reset state when picker closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setIsExpanded(false)
    }
  }, [isOpen])

  // Handle category selection
  const handleSelect = (category: CategorySuggestion) => {
    onSelect(category)
    onClose()
  }

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Don't render until mounted (avoids SSR hydration issues)
  if (!mounted || typeof document === 'undefined') return null

  const portalContainer = document.body
  if (!portalContainer) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] flex flex-col"
          >
            {/* Sheet container */}
            <div
              className="rounded-t-3xl overflow-hidden card-shadow flex flex-col max-h-full"
              style={{ backgroundColor: colors.bgColor }}
            >
              {/* Handle bar */}
              <div className="flex justify-center py-3">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-12 h-1.5 rounded-full opacity-30 hover:opacity-50 transition-opacity"
                  style={{ backgroundColor: colors.textColor }}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                />
              </div>

              {/* Search - always visible */}
              <div className="px-4 pb-3">
                    <div className="relative">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search categories..."
                        className="w-full py-3 px-4 pr-10 rounded-xl text-base outline-none"
                        style={{
                          backgroundColor: `${colors.textColor}15`,
                          color: colors.textColor,
                        }}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-50 hover:opacity-100"
                          style={{ color: colors.textColor }}
                        >
                          ×
                        </button>
                      )}
                    </div>
              </div>

              {/* Category list */}
              <div className="overflow-y-auto flex-1 pb-8">
                {displayedCategories.length === 0 ? (
                  <div
                    className="text-center py-8 opacity-60"
                    style={{ color: colors.textColor }}
                  >
                    No categories found
                  </div>
                ) : (
                  <div className="px-2">
                    {displayedCategories.map((category, index) => (
                      <motion.button
                        key={`${category.id}-${category.name}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSelect(category)}
                        className="w-full text-left px-4 py-3.5 rounded-xl mb-1 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        style={{
                          backgroundColor:
                            category.name === suggestedCategory
                              ? `${colors.textColor}20`
                              : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div
                              className="font-semibold text-base"
                              style={{ color: colors.textColor }}
                            >
                              {category.name}
                              {category.name === suggestedCategory && (
                                <span className="ml-2 text-xs opacity-60">
                                  ★ suggested
                                </span>
                              )}
                            </div>
                            <div
                              className="text-sm opacity-50"
                              style={{ color: colors.textColor }}
                            >
                              {category.groupName}
                            </div>
                          </div>
                          {/* Confidence indicator for top suggestions */}
                          {category.confidence > 0.5 && !searchQuery && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: colors.textColor,
                                opacity: category.confidence,
                              }}
                            />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Expand prompt when collapsed */}
                {!isExpanded && !searchQuery && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full text-center py-4 text-sm opacity-50 hover:opacity-80 transition-opacity"
                    style={{ color: colors.textColor }}
                  >
                    Show all categories ↑
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalContainer
  )
}
