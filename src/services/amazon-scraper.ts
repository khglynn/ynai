import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as os from 'os';

const USER_DATA_DIR = path.join(os.homedir(), '.ynab-organizer', 'amazon-session');
const ORDER_HISTORY_URL = 'https://www.amazon.com/gp/css/order-history';

export interface AmazonOrderItem {
  name: string;
  priceCents: number;
  quantity: number;
}

export interface AmazonOrder {
  orderId: string;
  orderDate: Date;
  totalCents: number;
  items: AmazonOrderItem[];
}

export interface ScrapingResult {
  orders: AmazonOrder[];
  needsLogin: boolean;
  error?: string;
}

/**
 * Launch browser with persistent user data directory (keeps FULL session including cache, IndexedDB, etc.)
 */
async function launchBrowser(): Promise<{ browser: Browser; context: BrowserContext }> {
  const fs = await import('fs');

  // Ensure user data directory exists
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  // Use launchPersistentContext for better session persistence
  // This keeps the full browser profile, not just cookies
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false, // Need visible browser for login
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  // Note: with persistent context, browser() returns null, but we can still close via context
  return { browser: null as any, context };
}

/**
 * Load saved session state if it exists
 */
async function loadStorageState(): Promise<any | undefined> {
  const fs = await import('fs');
  const statePath = path.join(USER_DATA_DIR, 'storage-state.json');

  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
  } catch {
    // Ignore errors, will create new session
  }
  return undefined;
}

/**
 * Save session state for future use
 */
async function saveStorageState(context: BrowserContext): Promise<void> {
  const fs = await import('fs');
  const statePath = path.join(USER_DATA_DIR, 'storage-state.json');

  // Ensure directory exists
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });

  const state = await context.storageState();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

/**
 * Check if user is logged in to Amazon
 */
async function isLoggedIn(page: Page): Promise<boolean> {
  // Look for common logged-in indicators
  const accountText = await page.locator('#nav-link-accountList-nav-line-1').textContent().catch(() => null);
  return accountText !== null && !accountText.toLowerCase().includes('sign in');
}

/**
 * Wait for user to complete login manually
 */
async function waitForLogin(page: Page, context: BrowserContext): Promise<boolean> {
  console.log('\n=== Amazon Login Required ===');
  console.log('Please log in to Amazon in the browser window.');
  console.log('The script will continue once you\'re logged in.\n');

  // Navigate to login page
  await page.goto('https://www.amazon.com/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fgp%2Fcss%2Forder-history&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=usflex&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0');

  // Wait up to 5 minutes for login
  const maxWait = 5 * 60 * 1000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    await page.waitForTimeout(2000);

    // Check if we're on the order history page (successful login)
    const url = page.url();
    if (url.includes('order-history') || url.includes('your-orders')) {
      console.log('Login successful!\n');
      await saveStorageState(context);
      return true;
    }

    // Check if logged in on any page
    if (await isLoggedIn(page)) {
      console.log('Login detected, navigating to order history...\n');
      await saveStorageState(context);
      return true;
    }
  }

  console.log('Login timeout - please try again.\n');
  return false;
}

/**
 * Parse order date from Amazon's format
 */
function parseOrderDate(dateStr: string): Date {
  // Amazon uses formats like "December 10, 2024" or "Dec 10, 2024"
  const cleaned = dateStr.replace(/\s+/g, ' ').trim();
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  // Fallback to today
  return new Date();
}

/**
 * Parse price from Amazon's format
 */
function parsePriceCents(priceStr: string): number {
  // Handle formats like "$15.99", "15.99", "$1,234.56"
  const cleaned = priceStr.replace(/[$,]/g, '').trim();
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

/**
 * Extract orders from the order history page using page content evaluation
 */
async function extractOrdersFromPage(page: Page): Promise<AmazonOrder[]> {
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Extract order data using DOM structure
  const orders = await page.evaluate(() => {
    const results: Array<{
      orderId: string;
      orderDate: string;
      totalCents: number;
      items: Array<{ name: string; priceCents: number; quantity: number }>;
    }> = [];

    // Find all SPAN elements containing order IDs
    const spans = document.querySelectorAll('span');
    const orderIdSpans: Element[] = [];

    spans.forEach(span => {
      const text = span.textContent || '';
      // Match order ID pattern (e.g., "114-8783566-8829822")
      if (/^\d{3}-\d{7}-\d{7}$/.test(text.trim())) {
        orderIdSpans.push(span);
      }
    });

    // For each order ID span, navigate up to find container with date and total
    for (const orderIdSpan of orderIdSpans) {
      const orderId = orderIdSpan.textContent?.trim() || '';
      if (!orderId) continue;

      // Navigate up to find the order container (usually 5-10 levels up)
      let container = orderIdSpan.parentElement;
      let dateStr = '';
      let totalCents = 0;

      for (let i = 0; i < 15 && container; i++) {
        const containerText = container.textContent || '';

        // Check if this container has both date and total info (Total and $ may have whitespace)
        if (containerText.includes('Order placed') && containerText.includes('Total')) {
          // Extract date
          const dateMatch = containerText.match(/Order placed\s*(\w+\s+\d{1,2},?\s+\d{4})/);
          if (dateMatch) dateStr = dateMatch[1].trim();

          // Extract total (handle whitespace between Total and $)
          const totalMatch = containerText.match(/Total\s*\$\s*([0-9,.]+)/);
          if (totalMatch) {
            const totalStr = totalMatch[1].replace(',', '');
            totalCents = Math.round(parseFloat(totalStr) * 100);
          }

          // Only break if we found both values
          if (dateStr && totalCents > 0) break;
        }
        container = container.parentElement;
      }

      // Skip duplicates and orders without valid data
      if (!dateStr || results.find(r => r.orderId === orderId)) continue;

      results.push({
        orderId,
        orderDate: dateStr,
        totalCents,
        items: [],
      });
    }

    return results;
  });

  // Now get items separately with better targeting
  const itemsData = await page.evaluate(() => {
    const items: Array<{ name: string; orderId: string }> = [];

    // Find all product links and try to associate with order IDs
    const orderBlocks = document.querySelectorAll('[class*="order"]');

    orderBlocks.forEach((block) => {
      const blockText = block.textContent || '';
      const orderIdMatch = blockText.match(/Order\s*#\s*(\d{3}-\d{7}-\d{7})/);
      const orderId = orderIdMatch?.[1] || '';

      if (orderId) {
        // Find product links within this block
        const links = block.querySelectorAll('a[href*="/dp/"]');
        links.forEach((link) => {
          const name = link.textContent?.trim();
          if (name && name.length > 5 && name.length < 250) {
            // Skip if it's just "Buy it again" or similar
            if (!name.toLowerCase().includes('buy it again') &&
                !name.toLowerCase().includes('view your item')) {
              items.push({ name, orderId });
            }
          }
        });
      }
    });

    return items;
  });

  // Associate items with orders
  const orderMap = new Map<string, AmazonOrder>();
  for (const order of orders) {
    orderMap.set(order.orderId, {
      orderId: order.orderId,
      orderDate: parseOrderDate(order.orderDate),
      totalCents: order.totalCents,
      items: [],
    });
  }

  for (const item of itemsData) {
    const order = orderMap.get(item.orderId);
    if (order) {
      // Avoid duplicates
      if (!order.items.find((i) => i.name === item.name)) {
        order.items.push({
          name: item.name.slice(0, 200),
          priceCents: 0,
          quantity: 1,
        });
      }
    }
  }

  return Array.from(orderMap.values());
}

/**
 * Navigate to next page of orders
 */
async function goToNextPage(page: Page): Promise<boolean> {
  const nextButton = await page.locator('.a-pagination .a-last a, [aria-label="Go to next page"]').first();
  const isDisabled = await nextButton.getAttribute('aria-disabled');

  if (isDisabled === 'true') return false;

  try {
    await nextButton.click();
    await page.waitForLoadState('networkidle');
    return true;
  } catch {
    return false;
  }
}

/**
 * Main scraping function
 */
export async function scrapeOrderHistory(options: {
  maxOrders?: number;
  afterDate?: string;
  onProgress?: (message: string) => void;
}): Promise<ScrapingResult> {
  const log = options.onProgress || console.log;
  const maxOrders = options.maxOrders || 50;

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    log('Launching browser...');
    const result = await launchBrowser();
    browser = result.browser;
    context = result.context;

    const page = await context.newPage();

    // Navigate to order history
    log('Navigating to Amazon order history...');
    await page.goto(ORDER_HISTORY_URL);
    await page.waitForLoadState('networkidle');

    // Check if logged in
    if (!await isLoggedIn(page)) {
      const loggedIn = await waitForLogin(page, context);
      if (!loggedIn) {
        return { orders: [], needsLogin: true, error: 'Login required' };
      }
      // Navigate back to order history after login
      await page.goto(ORDER_HISTORY_URL);
      await page.waitForLoadState('networkidle');
    }

    // Scrape orders
    const allOrders: AmazonOrder[] = [];
    let pageNum = 1;

    while (allOrders.length < maxOrders) {
      log(`Scraping page ${pageNum}...`);
      const pageOrders = await extractOrdersFromPage(page);

      // Filter by date if specified
      let filteredOrders = pageOrders;
      if (options.afterDate) {
        const afterDate = new Date(options.afterDate);
        filteredOrders = pageOrders.filter((o) => o.orderDate >= afterDate);
      }

      allOrders.push(...filteredOrders);
      log(`Found ${pageOrders.length} orders on page ${pageNum} (${allOrders.length} total)`);

      // Check if we have enough or should continue
      if (allOrders.length >= maxOrders) break;

      // If we filtered out orders due to date and got few results, we're past the date range
      if (options.afterDate && filteredOrders.length < pageOrders.length) {
        log('Reached orders before target date, stopping.');
        break;
      }

      // Try to go to next page
      const hasNext = await goToNextPage(page);
      if (!hasNext) {
        log('No more pages.');
        break;
      }

      pageNum++;

      // Safety limit
      if (pageNum > 20) {
        log('Reached page limit.');
        break;
      }
    }

    // Save session for next time
    await saveStorageState(context);

    return {
      orders: allOrders.slice(0, maxOrders),
      needsLogin: false,
    };
  } catch (e: any) {
    return {
      orders: [],
      needsLogin: false,
      error: e.message,
    };
  } finally {
    // With launchPersistentContext, we close the context (not browser)
    if (context) {
      await context.close();
    }
  }
}

/**
 * Test if Amazon session is valid
 */
export async function testAmazonConnection(): Promise<boolean> {
  let context: BrowserContext | null = null;

  try {
    console.log('Testing Amazon connection...');
    const result = await launchBrowser();
    context = result.context;

    const page = await context.newPage();
    await page.goto(ORDER_HISTORY_URL);
    await page.waitForLoadState('networkidle');

    const loggedIn = await isLoggedIn(page);

    if (loggedIn) {
      console.log('Amazon session is valid.');
      return true;
    } else {
      console.log('Amazon login required.');
      return false;
    }
  } catch (e: any) {
    console.error('Connection test failed:', e.message);
    return false;
  } finally {
    if (context) {
      await context.close();
    }
  }
}
