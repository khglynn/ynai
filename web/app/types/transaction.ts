// Transaction types and stubbed data for UI development
// Will be replaced with real YNAB data later

import { Sticker } from '../lib/stickers'

// Category suggestion with confidence scoring
export interface CategorySuggestion {
  id: string
  name: string
  groupName: string      // YNAB category group (e.g., "Monthly Bills")
  confidence: number     // 0-1, for sorting
}

export interface Transaction {
  id: string
  payee: string
  amount: number         // in dollars (display format)
  date: string           // ISO date string
  suggestedCategory: string
  confidence: number     // 0-1, AI suggestion confidence
  alternativeCategories?: CategorySuggestion[]  // Other possible categories
  memo?: string
}

export type SwipeDirection = 'approved' | 'later'

export interface SwipeResult {
  transaction: Transaction
  direction: SwipeDirection
  timestamp: Date
}

// Transaction paired with a sticker for display
export interface TransactionCard extends Transaction {
  sticker: Sticker
}

// Fake transactions for UI development and testing
// Mix of common Austin payees and typical categories
export const FAKE_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    payee: 'H-E-B',
    amount: 127.43,
    date: '2025-12-18',
    suggestedCategory: 'Groceries',
    confidence: 0.95,
  },
  {
    id: '2',
    payee: 'Amazon',
    amount: 34.99,
    date: '2025-12-17',
    suggestedCategory: 'Shopping',
    confidence: 0.72,
  },
  {
    id: '3',
    payee: 'Spotify',
    amount: 10.99,
    date: '2025-12-15',
    suggestedCategory: 'Subscriptions',
    confidence: 0.99,
  },
  {
    id: '4',
    payee: 'Uber Eats',
    amount: 28.50,
    date: '2025-12-14',
    suggestedCategory: 'Dining Out',
    confidence: 0.88,
  },
  {
    id: '5',
    payee: 'Shell',
    amount: 45.00,
    date: '2025-12-13',
    suggestedCategory: 'Gas & Fuel',
    confidence: 0.97,
  },
  {
    id: '6',
    payee: 'Torchy\'s Tacos',
    amount: 18.75,
    date: '2025-12-12',
    suggestedCategory: 'Dining Out',
    confidence: 0.91,
  },
  {
    id: '7',
    payee: 'Netflix',
    amount: 15.99,
    date: '2025-12-11',
    suggestedCategory: 'Subscriptions',
    confidence: 0.98,
  },
  {
    id: '8',
    payee: 'Target',
    amount: 67.23,
    date: '2025-12-10',
    suggestedCategory: 'Shopping',
    confidence: 0.65,
    memo: 'Household items',
  },
  {
    id: '9',
    payee: 'Austin Energy',
    amount: 142.87,
    date: '2025-12-09',
    suggestedCategory: 'Utilities',
    confidence: 0.99,
  },
  {
    id: '10',
    payee: 'Costco',
    amount: 234.56,
    date: '2025-12-08',
    suggestedCategory: 'Groceries',
    confidence: 0.82,
  },
  {
    id: '11',
    payee: 'Starbucks',
    amount: 7.45,
    date: '2025-12-07',
    suggestedCategory: 'Coffee Shops',
    confidence: 0.94,
  },
  {
    id: '12',
    payee: 'CVS Pharmacy',
    amount: 23.99,
    date: '2025-12-06',
    suggestedCategory: 'Health & Wellness',
    confidence: 0.76,
  },
]
