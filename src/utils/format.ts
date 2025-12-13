/**
 * Convert YNAB milliunits to currency string
 * YNAB stores amounts as milliunits (1000 = $1.00)
 */
export function formatCurrency(milliunits: number): string {
  const amount = milliunits / 1000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Truncate a string to a max length with ellipsis
 */
export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Pad a string to a fixed width (for table alignment)
 */
export function pad(str: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (str.length >= width) return str;
  const padding = ' '.repeat(width - str.length);
  return align === 'left' ? str + padding : padding + str;
}
