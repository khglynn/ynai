import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config();

const sql = neon(process.env.NEON_DATABASE_URL!);

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: 'high' | 'medium' | 'low';
  matchCount: number;
}

/**
 * Get a category suggestion based on payee name
 */
export async function getSuggestion(payeeName: string): Promise<CategorySuggestion | null> {
  if (!payeeName) return null;

  // Normalize payee name for matching
  const normalized = normalizePayeeName(payeeName);

  try {
    // Look for exact or similar matches
    const results = await sql`
      SELECT
        category_id,
        category_name,
        confidence,
        correct_count,
        incorrect_count
      FROM payee_patterns
      WHERE LOWER(payee_name) = LOWER(${normalized})
        OR LOWER(${normalized}) LIKE '%' || LOWER(payee_name) || '%'
      ORDER BY correct_count DESC, confidence DESC
      LIMIT 1
    `;

    if (results.length === 0) return null;

    const pattern = results[0];
    const totalCount = (pattern.correct_count || 0) + (pattern.incorrect_count || 0);
    const accuracy = totalCount > 0 ? (pattern.correct_count || 0) / totalCount : 0;

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low';
    if (accuracy >= 0.9 && totalCount >= 3) {
      confidence = 'high';
    } else if (accuracy >= 0.7 && totalCount >= 2) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      categoryId: pattern.category_id,
      categoryName: pattern.category_name,
      confidence,
      matchCount: pattern.correct_count || 0,
    };
  } catch (e) {
    console.error('Error getting suggestion:', e);
    return null;
  }
}

/**
 * Record a categorization choice for pattern learning
 */
export async function recordChoice(
  payeeName: string,
  categoryId: string,
  categoryName: string,
  wasCorrectSuggestion: boolean = true
): Promise<void> {
  if (!payeeName) return;

  const normalized = normalizePayeeName(payeeName);

  try {
    if (wasCorrectSuggestion) {
      // Upsert with correct_count increment
      await sql`
        INSERT INTO payee_patterns (payee_name, category_id, category_name, correct_count, last_used)
        VALUES (${normalized}, ${categoryId}, ${categoryName}, 1, NOW())
        ON CONFLICT (payee_name) DO UPDATE SET
          category_id = ${categoryId},
          category_name = ${categoryName},
          correct_count = payee_patterns.correct_count + 1,
          last_used = NOW()
      `;
    } else {
      // Record that we got it wrong - user chose different category
      await sql`
        UPDATE payee_patterns
        SET incorrect_count = incorrect_count + 1,
            last_used = NOW()
        WHERE LOWER(payee_name) = LOWER(${normalized})
      `;

      // Also record the new correct mapping
      await sql`
        INSERT INTO payee_patterns (payee_name, category_id, category_name, correct_count, last_used)
        VALUES (${normalized}, ${categoryId}, ${categoryName}, 1, NOW())
        ON CONFLICT (payee_name) DO UPDATE SET
          category_id = ${categoryId},
          category_name = ${categoryName},
          correct_count = payee_patterns.correct_count + 1,
          last_used = NOW()
      `;
    }
  } catch (e) {
    console.error('Error recording choice:', e);
  }
}

/**
 * Get Amazon order items for a matched transaction
 */
export async function getAmazonOrderItems(transactionId: string): Promise<{
  orderId: string;
  items: Array<{ name: string; priceCents: number; quantity: number }>;
} | null> {
  try {
    const results = await sql`
      SELECT order_id, items
      FROM amazon_orders
      WHERE matched_transaction_id = ${transactionId}
      LIMIT 1
    `;

    if (results.length === 0) return null;

    return {
      orderId: results[0].order_id,
      items: results[0].items || [],
    };
  } catch (e) {
    console.error('Error getting Amazon order:', e);
    return null;
  }
}

/**
 * Get Apple receipt info for a matched transaction
 */
export async function getAppleReceiptInfo(transactionId: string): Promise<{
  itemName: string;
  itemType: string;
  amountCents: number;
} | null> {
  try {
    const results = await sql`
      SELECT item_name, item_type, amount_cents
      FROM apple_receipts
      WHERE matched_transaction_id = ${transactionId}
      LIMIT 1
    `;

    if (results.length === 0) return null;

    return {
      itemName: results[0].item_name || 'Unknown',
      itemType: results[0].item_type || 'Unknown',
      amountCents: results[0].amount_cents || 0,
    };
  } catch (e) {
    console.error('Error getting Apple receipt:', e);
    return null;
  }
}

/**
 * Normalize payee name for consistent matching
 */
function normalizePayeeName(name: string): string {
  return name
    .trim()
    // Remove common transaction prefixes
    .replace(/^(TST\*|SQ\*|SP\s+|PAYPAL\s+\*)/i, '')
    // Remove trailing numbers/IDs
    .replace(/\s+#?\d+$/, '')
    // Remove city/state suffixes
    .replace(/\s+(TX|CA|NY|FL|AUSTIN|HOUSTON|DALLAS)\s*$/i, '')
    .trim();
}

/**
 * Batch record multiple choices (for efficiency)
 */
export async function recordChoices(
  choices: Array<{
    payeeName: string;
    categoryId: string;
    categoryName: string;
  }>
): Promise<void> {
  for (const choice of choices) {
    await recordChoice(choice.payeeName, choice.categoryId, choice.categoryName);
  }
}
