// One-time Google Calendar authorization.
// Run with: npm run authorize
// Outputs GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN for your .env file.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const desktopPath = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop');
let secretFile;

try {
  secretFile = fs.readdirSync(desktopPath).find(
    f => f.startsWith('client_secret') && f.endsWith('.json')
  );
} catch (e) {
  console.error('Could not read Desktop folder:', e.message);
  process.exit(1);
}

if (!secretFile) {
  console.error('\nNo client_secret*.json file found on your Desktop.');
  console.error('Download it from: Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 client → Download JSON\n');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(path.join(desktopPath, secretFile), 'utf8'));
const creds = raw.installed || raw.web;

if (!creds) {
  console.error('Unexpected credentials file format. Expected "installed" or "web" key.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent',
});

console.log('\nOpening browser for Google authorization...');
exec(`start "" "${authUrl}"`);
console.log('\nIf the browser did not open, visit:\n');
console.log(authUrl);
console.log('\nWaiting for callback on http://localhost:3000...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  if (url.pathname !== '/oauth2callback') return res.end();

  const code = url.searchParams.get('code');
  if (!code) {
    res.end('No authorization code received. Close this tab and try again.');
    return server.close();
  }

  res.end('<html><body><h2>Authorization successful!</h2><p>You can close this tab and return to your terminal.</p></body></html>');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Authorization successful!\n');
    console.log('Copy these three lines into your .env file:\n');
    console.log(`GOOGLE_CLIENT_ID=${creds.client_id}`);
    console.log(`GOOGLE_CLIENT_SECRET=${creds.client_secret}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\nDone.\n');
  } catch (err) {
    console.error('Token exchange failed:', err.message);
  }

  server.close();
});

server.listen(3000, () => console.log('Listening on http://localhost:3000 for OAuth callback...'));
