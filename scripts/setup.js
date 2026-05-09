// Creates the Vapi assistant and imports your Twilio phone number.
// Run AFTER deploying to Render and setting BACKEND_URL in .env.
// Run with: npm run setup

require('dotenv').config();
const { buildAssistantConfig } = require('../src/vapi/assistantConfig');

const VAPI_BASE = 'https://api.vapi.ai';

async function vapiRequest(method, endpoint, body) {
  const res = await fetch(`${VAPI_BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Vapi ${method} ${endpoint} → HTTP ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function main() {
  const missing = ['VAPI_API_KEY', 'BACKEND_URL', 'OPENAI_API_KEY'].filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required .env values: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.BACKEND_URL.includes('your-app')) {
    console.error('BACKEND_URL still has the placeholder value. Deploy to Render first, then update it.');
    process.exit(1);
  }

  console.log(`\nCreating Vapi assistant for "${process.env.SALON_NAME || 'SalonAnswer'}"...`);
  const config = buildAssistantConfig(process.env.BACKEND_URL);
  const assistant = await vapiRequest('POST', '/assistant', config);
  console.log(`✓ Assistant created`);
  console.log(`  ID:   ${assistant.id}`);
  console.log(`  Name: ${assistant.name}`);

  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  if (!twilioPhone || twilioPhone.includes('XXXXXXXXXX')) {
    console.log('\nSkipping phone number import — TWILIO_PHONE_NUMBER not set.');
    console.log(`Set it in .env and re-run this script to link your Twilio number.\n`);
    console.log(`Assistant ID: ${assistant.id}`);
    return;
  }

  console.log(`\nImporting Twilio number ${twilioPhone} into Vapi...`);
  const phoneNumber = await vapiRequest('POST', '/phone-number', {
    provider: 'twilio',
    number: twilioPhone,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    assistantId: assistant.id,
  });

  console.log(`✓ Phone number imported: ${phoneNumber.id}`);
  console.log(`\nAll done. Call ${twilioPhone} to test.\n`);
}

main().catch(err => {
  console.error('\nSetup failed:', err.message);
  process.exit(1);
});
