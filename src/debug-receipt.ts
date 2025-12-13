import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, '../data/credentials/gmail-oauth-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../data/credentials/gmail-token.json');

async function main() {
  const { client_id, client_secret } = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8')).installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
  oauth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8')));
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  // Get receipts around dates that failed parsing
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:apple.com subject:receipt after:2025-11-19 before:2025-11-21',
    maxResults: 5,
  });
  
  for (const m of response.data.messages || []) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: m.id!,
      format: 'full',
    });
    
    const headers = msg.data.payload?.headers || [];
    const date = headers.find(h => h.name?.toLowerCase() === 'date')?.value;
    console.log('\n=== Receipt from', date, '===');
    
    const payload = msg.data.payload;
    let body = '';
    
    if (payload?.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
    }
    
    // Strip HTML
    const text = body
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(text.slice(0, 2500));
  }
}

main().catch(console.error);
