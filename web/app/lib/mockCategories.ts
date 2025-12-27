// Mock YNAB-style categories for UI development
// Will be replaced with real YNAB categories later

import { CategorySuggestion } from '../types/transaction'

// YNAB-style category groups with their categories
export const MOCK_CATEGORY_GROUPS = [
  {
    name: 'Immediate Obligations',
    categories: ['Rent/Mortgage', 'Electric', 'Water', 'Internet', 'Phone', 'Insurance'],
  },
  {
    name: 'True Expenses',
    categories: ['Auto Maintenance', 'Home Maintenance', 'Medical', 'Clothing', 'Gifts'],
  },
  {
    name: 'Debt Payments',
    categories: ['Student Loans', 'Car Payment', 'Credit Card Payment'],
  },
  {
    name: 'Quality of Life',
    categories: ['Groceries', 'Dining Out', 'Coffee Shops', 'Entertainment', 'Subscriptions', 'Hobbies'],
  },
  {
    name: 'Just for Fun',
    categories: ['Shopping', 'Games', 'Music', 'Fun Money'],
  },
  {
    name: 'Giving',
    categories: ['Charity', 'Gifts', 'Tithing'],
  },
  {
    name: 'Transportation',
    categories: ['Gas & Fuel', 'Parking', 'Public Transit', 'Uber/Lyft'],
  },
  {
    name: 'Health & Wellness',
    categories: ['Pharmacy', 'Gym', 'Doctor', 'Therapy', 'Self Care'],
  },
  {
    name: 'Utilities',
    categories: ['Electric', 'Gas', 'Water', 'Trash', 'Internet'],
  },
]

// Flatten all categories into a lookup
const ALL_CATEGORIES: CategorySuggestion[] = MOCK_CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map((name, idx) => ({
    id: `${group.name.toLowerCase().replace(/\s+/g, '-')}-${idx}`,
    name,
    groupName: group.name,
    confidence: 0, // Will be set per-transaction
  }))
)

// Category relationships for smart suggestions
// Maps a suggested category to related alternatives
const CATEGORY_RELATIONS: Record<string, string[]> = {
  'Groceries': ['Dining Out', 'Coffee Shops', 'Shopping', 'Pharmacy'],
  'Shopping': ['Groceries', 'Clothing', 'Gifts', 'Fun Money', 'Hobbies'],
  'Subscriptions': ['Entertainment', 'Music', 'Streaming', 'Software'],
  'Dining Out': ['Groceries', 'Coffee Shops', 'Uber/Lyft', 'Entertainment'],
  'Gas & Fuel': ['Auto Maintenance', 'Parking', 'Uber/Lyft'],
  'Coffee Shops': ['Dining Out', 'Groceries', 'Fun Money'],
  'Utilities': ['Electric', 'Water', 'Internet', 'Phone'],
  'Health & Wellness': ['Pharmacy', 'Doctor', 'Gym', 'Self Care', 'Therapy'],
}

// Generate mock alternatives for a transaction based on its suggested category
export function getMockAlternatives(
  suggestedCategory: string,
  suggestedConfidence: number
): CategorySuggestion[] {
  // Get related categories or fall back to common ones
  const related = CATEGORY_RELATIONS[suggestedCategory] || [
    'Shopping',
    'Groceries',
    'Dining Out',
    'Entertainment',
  ]

  // Create the suggested category as top pick
  const suggested: CategorySuggestion = {
    id: 'suggested',
    name: suggestedCategory,
    groupName: findGroupForCategory(suggestedCategory),
    confidence: suggestedConfidence,
  }

  // Generate alternatives with decreasing confidence
  const alternatives: CategorySuggestion[] = related.slice(0, 5).map((name, idx) => ({
    id: `alt-${idx}`,
    name,
    groupName: findGroupForCategory(name),
    confidence: Math.max(0.1, suggestedConfidence - 0.15 - idx * 0.1),
  }))

  // Return suggested first, then alternatives sorted by confidence
  return [suggested, ...alternatives].sort((a, b) => b.confidence - a.confidence)
}

// Find which group a category belongs to
function findGroupForCategory(categoryName: string): string {
  for (const group of MOCK_CATEGORY_GROUPS) {
    if (group.categories.includes(categoryName)) {
      return group.name
    }
  }
  return 'Uncategorized'
}

// Get all categories for search
export function getAllCategories(): CategorySuggestion[] {
  return ALL_CATEGORIES.map((cat) => ({
    ...cat,
    confidence: 0.5, // Neutral confidence for search results
  }))
}
