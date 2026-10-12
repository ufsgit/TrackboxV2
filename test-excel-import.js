/**
 * Test script for Excel Import API
 * Run: node test-excel-import.js
 * 
 * This validates the /contacts/import-excel endpoint directly.
 * Make sure the backend server is running on the correct port.
 */

const http = require('http');
const https = require('https');

// ─── CONFIG ────────────────────────────────────────
// Grab the token from browser localStorage: localStorage.getItem('token')
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'PASTE_YOUR_JWT_TOKEN_HERE';
const BASE_URL   = 'http://localhost:3000'; // adjust if backend is on different port

// ─── SAMPLE PAYLOAD (mimics what the frontend sends) ─
const payload = {
  leads: [
    { Name: 'Test Import Lead 1', Phone: '9876543000', Email: 'test1@example.com' },
    { Name: 'Test Import Lead 2', Phone: '9876543001', Email: 'test2@example.com' },
    { Name: 'Duplicate Phone Test',  Phone: '9876543000' }, // Should be skipped (dup of row 1)
    { Name: 'Short Phone',           Phone: '12345'       }, // Should be skipped (invalid)
    { Name: 'No Phone Lead'                               }, // Should be skipped (no phone, no useful data)
  ],
  statusAndAssignment: {
    status: 'PENDING',        // Change to any valid status name from your DB
    branch: '',
    department: '',
    assigned_employee: '',
    remark: 'Imported via test script',
    follow_up_date: '',
    loss_reason: ''
  }
};

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(BASE_URL + path);
    const lib = url.protocol === 'https:' ? https : http;

    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname,
      method,
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`
      }
    };

    const req = lib.request(opts, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  if (AUTH_TOKEN === 'PASTE_YOUR_JWT_TOKEN_HERE') {
    console.error('\n❌  AUTH_TOKEN not set!');
    console.error('   Get it from: Browser DevTools → Application → Local Storage → token');
    console.error('   Then run:  AUTH_TOKEN=<token> node test-excel-import.js\n');
    process.exit(1);
  }

  console.log('\n🧪  Testing POST /contacts/import-excel ...\n');
  console.log('   Payload:', JSON.stringify(payload, null, 2));

  const res = await request('POST', '/contacts/import-excel', payload, AUTH_TOKEN);

  console.log('\n─── RESPONSE ───────────────────────────────────');
  console.log('   HTTP Status :', res.status);
  console.log('   Body        :', JSON.stringify(res.body, null, 2));

  if (res.status === 200 && res.body?.success) {
    const { inserted, skipped, errors } = res.body.data || {};
    console.log('\n✅  Import succeeded!');
    console.log(`   Inserted : ${inserted}`);
    console.log(`   Skipped  : ${skipped}`);
    if (errors?.length) {
      console.log('   Errors   :');
      errors.forEach(e => console.log('    -', e));
    }
    console.log('\n👉  Go to http://localhost:4200/#/contacts to verify imported leads appear.\n');
  } else {
    console.log('\n❌  Import failed. Check response above.\n');
  }
}

run().catch(err => {
  console.error('\n💥  Request error:', err.message);
  console.error('   Is the backend server running?\n');
});
