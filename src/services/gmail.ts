import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, '../../data/credentials/gmail-oauth-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../data/credentials/gmail-token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

interface AppleReceipt {
  messageId: string;
  date: Date;
  amountCents: number;
  itemName: string;
  itemType: 'app' | 'subscription' | 'icloud' | 'music' | 'other';
  rawSubject: string;
}

/**
 * Load saved credentials if they exist
 */
function loadSavedCredentials(): OAuth2Client | null {
  try {
    const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    const { client_id, client_secret } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8')).installed;
    const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
    oauth2Client.setCredentials(credentials);
    return oauth2Client;
  } catch {
    return null;
  }
}

/**
 * Save credentials to file for future use
 */
function saveCredentials(client: OAuth2Client): void {
  const payload = JSON.stringify(client.credentials);
  fs.writeFileSync(TOKEN_PATH, payload);
  console.log('Token stored to', TOKEN_PATH);
}

/**
 * Get OAuth2 client, prompting for authorization if needed
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  // Try to load existing token
  const savedClient = loadSavedCredentials();
  if (savedClient) {
    return savedClient;
  }

  // Need to authenticate
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8')).installed;
  const { client_id, client_secret, redirect_uris } = credentials;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('\n=== Gmail Authorization Required ===');
  console.log('Visit this URL to authorize access:\n');
  console.log(authUrl);
  console.log('\nAfter authorizing, you\'ll get a code. Paste it below.\n');

  // Prompt for code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise<string>((resolve) => {
    rl.question('Enter the code: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  // Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  saveCredentials(oauth2Client);

  return oauth2Client;
}

/**
 * Search Gmail for Apple receipts
 */
export async function searchAppleReceipts(
  auth: OAuth2Client,
  options: { after?: string; maxResults?: number } = {}
): Promise<AppleReceipt[]> {
  const gmail = google.gmail({ version: 'v1', auth });

  // Build search query for Apple receipts
  let query = 'from:apple.com subject:receipt';
  if (options.after) {
    query += ` after:${options.after}`;
  }

  console.log(`Searching Gmail: "${query}"`);

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: options.maxResults || 100,
  });

  const messages = response.data.messages || [];
  console.log(`Found ${messages.length} Apple receipt emails`);

  const receipts: AppleReceipt[] = [];

  for (const msg of messages) {
    try {
      const receipt = await parseAppleReceipt(gmail, msg.id!);
      if (receipt) {
        receipts.push(receipt);
      }
    } catch (e) {
      console.error(`Error parsing message ${msg.id}:`, e);
    }
  }

  return receipts;
}

/**
 * Strip HTML tags and normalize whitespace to get plain text
 */
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract line items from Apple receipt text
 * Returns array of {name, planType, amount} objects
 */
function extractLineItems(text: string): Array<{ name: string; planType: string; amount: number }> {
  const items: Array<{ name: string; planType: string; amount: number }> = [];

  // Split text into chunks around price patterns
  // Look for patterns like "(Monthly) ... $XX.XX" or "(Yearly) ... $XX.XX"
  const chunks = text.split(/\$(\d+\.\d{2})/);

  for (let i = 0; i < chunks.length - 1; i += 2) {
    const beforePrice = chunks[i];
    const price = parseFloat(chunks[i + 1]);

    if (!price || price <= 0) continue;

    // Special handling for AppleCare - format: "AppleCare+ with ... Monthly Plan ..."
    const appleCareMatch = beforePrice.match(/(AppleCare\+[^$]*?)(?:Monthly Plan|Yearly|Annual)/i);
    if (appleCareMatch) {
      // Extract just "AppleCare+ with Theft & Loss" - stop before description words
      // Common coverage types: "Theft & Loss", "Theft and Loss", nothing
      const appleClean = appleCareMatch[1].match(/AppleCare\+(?:\s+with\s+(?:Theft\s+(?:&|and)\s+Loss))?/i);
      const name = appleClean ? appleClean[0].trim() : 'AppleCare+';
      const planType = beforePrice.toLowerCase().includes('monthly') ? '(Monthly)' : '(Yearly)';
      items.push({ name, planType, amount: price });
      continue;
    }

    // Look for subscription pattern: something followed by (Monthly/Yearly/Annual) or similar
    // Also matches: "(7 Days)", "(1 Week)", etc.
    const subMatch = beforePrice.match(/([A-Za-z][A-Za-z0-9\s\-:\.&+]+?)\s*\((\d+\s*Days?|\d+\s*Weeks?|Monthly|Yearly|Annual|Weekly)\)[^(]*$/i);

    // Also try inline format: "Apple TV Monthly Renews..." (no parentheses)
    const inlineMatch = !subMatch && beforePrice.match(/([A-Za-z][A-Za-z0-9\s\-:\.&+]+?)\s+(Monthly|Yearly|Annual)\s+Renews/i);

    // Use whichever match we found
    const match = subMatch || inlineMatch;
    if (match) {
      let name = match[1].trim();
      const planType = `(${match[2]})`;

      // Clean up name - remove common prefixes and metadata
      // Run cleanup in multiple passes until no changes
      const cleanPatterns = [
        /DOCUMENT\s+NO\.\s*\d+\s*/gi,                     // Remove embedded "DOCUMENT NO. xxx"
        /(?:App Store|Mac App Store|iPhone|iPad|Report a Problem)\s*/gi,
        /(?:Renews|Billing|Order ID|APPLE ACCOUNT|Apple Account)[^A-Z]*/gi,
        /^.*?gmail\.com\s*/i,                              // Remove email prefix
        /^.*?@[a-z]+\.[a-z]+\s*/i,                        // Remove any email
        /^[A-Z0-9]{8,}\s+NO\.\s*\d+\s*/,                  // "MVWSZ09QF1 NO. 694059976280"
        /^[A-Z0-9]{8,}\s+/,                               // Remove standalone order IDs at start
        /^\s*\d+\s*/,                                      // Leading numbers
      ];
      let prevName = '';
      while (prevName !== name) {
        prevName = name;
        for (const pattern of cleanPatterns) {
          name = name.replace(pattern, '');
        }
        name = name.trim();
      }

      // Take last meaningful segment if name is too long
      if (name.length > 80) {
        const segments = name.split(/\s{2,}|\n/);
        name = segments[segments.length - 1] || name;
      }

      name = name.trim();
      if (name.length >= 3 && !/^\d+$/.test(name)) {
        items.push({ name, planType, amount: price });
      }
    }
  }

  return items;
}

/**
 * Parse a single Apple receipt email
 */
async function parseAppleReceipt(
  gmail: ReturnType<typeof google.gmail>,
  messageId: string
): Promise<AppleReceipt | null> {
  const msg = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  const headers = msg.data.payload?.headers || [];
  const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '';
  const dateStr = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';

  // Get email body (prefer HTML since Apple sends rich emails)
  let body = '';
  const payload = msg.data.payload;

  if (payload?.body?.data) {
    body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
  } else if (payload?.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        break;
      }
      if (part.mimeType === 'text/plain' && part.body?.data && !body) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  }

  // Convert HTML to plain text for parsing
  const textContent = htmlToText(body);

  // Extract line items from the receipt
  const lineItems = extractLineItems(textContent);

  // Use first line item for name, or fall back to subject
  let itemName = subject;
  let itemType: AppleReceipt['itemType'] = 'other';
  let amountCents = 0;

  if (lineItems.length > 0) {
    const firstItem = lineItems[0];
    itemName = firstItem.name;

    // Determine type based on plan
    if (firstItem.planType.toLowerCase().includes('monthly') ||
        firstItem.planType.toLowerCase().includes('yearly') ||
        firstItem.planType.toLowerCase().includes('annual') ||
        firstItem.planType.toLowerCase().includes('days') ||
        firstItem.planType.toLowerCase().includes('week')) {
      itemType = 'subscription';
    } else if (firstItem.planType === 'App') {
      itemType = 'app';
    }
  }

  // For amount, prefer TOTAL (what was actually charged) for YNAB matching
  // This includes tax, which is what appears in YNAB
  const totalMatch = textContent.match(/\bTOTAL\s*\$(\d+\.?\d*)/i);
  // Also try payment line format: "American Express •••• 5004 $14.06" or "Amex .... 5004 $14.06"
  const paymentMatch = textContent.match(/(?:American Express|Amex|Visa|Mastercard|Discover|Card)[^\$]*\$(\d+\.\d{2})/i);

  if (totalMatch) {
    amountCents = Math.round(parseFloat(totalMatch[1]) * 100);
  } else if (paymentMatch) {
    amountCents = Math.round(parseFloat(paymentMatch[1]) * 100);
  } else if (lineItems.length > 0) {
    // Fall back to first item price if no total found
    amountCents = Math.round(lineItems[0].amount * 100);
  } else {
    // Last resort: try subtotal or first dollar amount
    const subtotalMatch = textContent.match(/Subtotal\s*\$(\d+\.?\d*)/i);
    if (subtotalMatch) {
      amountCents = Math.round(parseFloat(subtotalMatch[1]) * 100);
    } else {
      const amountMatch = textContent.match(/\$(\d+\.?\d*)/);
      if (amountMatch) {
        amountCents = Math.round(parseFloat(amountMatch[1]) * 100);
      }
    }
  }

  // Special handling for known services
  if (textContent.toLowerCase().includes('icloud')) {
    itemType = 'icloud';
    if (itemName === subject) itemName = 'iCloud Storage';
  } else if (textContent.toLowerCase().includes('apple music')) {
    itemType = 'music';
    if (itemName === subject) itemName = 'Apple Music';
  }

  // Parse date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }

  return {
    messageId,
    date,
    amountCents,
    itemName: itemName.slice(0, 200),
    itemType,
    rawSubject: subject,
  };
}

/**
 * Test the Gmail connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const auth = await getAuthenticatedClient();
    const gmail = google.gmail({ version: 'v1', auth });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log(`Connected to Gmail as: ${profile.data.emailAddress}`);
    return true;
  } catch (e) {
    console.error('Gmail connection failed:', e);
    return false;
  }
}
