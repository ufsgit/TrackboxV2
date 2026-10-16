/**
 * Backend-only Verification & Diagnostic Script for Bulk Email Flow
 * Usage: node scripts/test-bulk-email.js <contactId>
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../src/db/pool');
const brevoService = require('../src/services/brevo.service');

async function run() {
  console.log('====================================================');
  console.log('       TRACKBOX CRM - BULK EMAIL DIAGNOSTIC         ');
  console.log('====================================================\n');

  const contactIdArg = process.argv[2];
  let contact = null;

  try {
    if (contactIdArg) {
      const [rows] = await pool.query(
        'SELECT id, business_id, name, email, phone FROM contacts WHERE id = ?',
        [contactIdArg]
      );
      if (rows.length > 0) {
        contact = rows[0];
      } else {
        console.warn(`[WARN] Contact with ID ${contactIdArg} not found. Searching for any contact with valid email...`);
      }
    }

    if (!contact) {
      const [rows] = await pool.query(
        "SELECT id, business_id, name, email, phone FROM contacts WHERE email IS NOT NULL AND email != '' AND email LIKE '%@%' ORDER BY id DESC LIMIT 1"
      );
      if (rows.length > 0) {
        contact = rows[0];
      }
    }

    // Step 1: Contact resolution
    if (!contact) {
      console.error('[FAIL] STEP 1: No contact found in database with an email address.');
      process.exit(1);
    }
    console.log('[PASS] STEP 1: Contact Found:');
    console.log(`       - ID: ${contact.id}`);
    console.log(`       - Business ID: ${contact.business_id}`);
    console.log(`       - Name: ${contact.name}`);
    console.log(`       - Email (Recipient): ${contact.email}\n`);

    // Step 2: Validate Email Format & Compare with Sender
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const recipientEmail = (contact.email || '').trim();
    if (!emailRegex.test(recipientEmail)) {
      console.error(`[FAIL] STEP 2: Email "${recipientEmail}" is not a valid format.`);
      process.exit(1);
    }

    const sender = brevoService.getSender();
    console.log('[PASS] STEP 2: Email is Valid & Sender Configured:');
    console.log(`       - Sender (From): "${sender.name}" <${sender.email}>`);
    console.log(`       - Recipient (To): "${contact.name}" <${recipientEmail}>`);

    if (recipientEmail.toLowerCase() === sender.email.toLowerCase()) {
      console.warn('       [WARN] Recipient email is identical to BREVO_SENDER_EMAIL.');
    } else {
      console.log('       [INFO] Recipient email is strictly different from BREVO_SENDER_EMAIL.');
    }
    console.log('');

    // Step 3: Call Brevo sendEmail
    console.log('[...] STEP 3: Calling Brevo API (POST https://api.brevo.com/v3/smtp/email)...');
    const testSubject = `Trackbox CRM Bulk Email Test (${Date.now()})`;
    const testBody = `<p>Hello <strong>${contact.name || 'Student'}</strong>,</p><p>This is a diagnostic test email dispatched from Trackbox CRM to verify end-to-end delivery.</p><p>Best regards,<br/>Trackbox Team</p>`;

    let brevoRes;
    try {
      brevoRes = await brevoService.sendEmail({
        toEmail: recipientEmail,
        toName: contact.name || 'Valued Contact',
        subject: testSubject,
        htmlContent: testBody,
        textContent: `Hello ${contact.name || 'Student'}, this is a diagnostic test email from Trackbox CRM.`
      });
      console.log('[PASS] STEP 3: Brevo accepted email dispatch.');
      console.log(`       - Full Brevo Result:`, brevoRes);
      console.log(`       - Brevo MessageId: ${brevoRes.messageId}\n`);
    } catch (brevoErr) {
      console.error('[FAIL] STEP 3: Brevo API call failed:');
      console.error('       Error:', brevoErr.message);
      if (brevoErr.brevoData) {
        console.error('       Brevo Error Body:', brevoErr.brevoData);
      }
      process.exit(1);
    }

    // Step 4: Insert into lead_emails
    console.log('[...] STEP 4: Saving email record into lead_emails table...');
    const normalizedMessageId = brevoRes.messageId ? brevoRes.messageId.replace(/[<>]/g, '').trim() : null;
    const testCampaignId = `TEST-${Date.now()}`;

    try {
      const [insertRes] = await pool.query(`
        INSERT INTO lead_emails (
          business_id, contact_id, campaign_id, brevo_message_id,
          sender_email, to_email, subject, content, status, bounce_reason, sent_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        contact.business_id || 1,
        contact.id,
        testCampaignId,
        normalizedMessageId,
        sender.email,
        recipientEmail,
        testSubject,
        testBody,
        'queued',
        null
      ]);

      const [savedRows] = await pool.query('SELECT * FROM lead_emails WHERE id = ?', [insertRes.insertId]);
      console.log('[PASS] STEP 4: DB record successfully inserted into lead_emails:');
      console.log(savedRows[0]);
      console.log('');
    } catch (dbErr) {
      console.error('[FAIL] STEP 4: Failed inserting into lead_emails:', dbErr);
      process.exit(1);
    }

    // Step 5: Query Brevo for Event Status (GET https://api.brevo.com/v3/smtp/emails?messageId=...)
    console.log('[...] STEP 5: Querying Brevo for immediate delivery event...');
    if (normalizedMessageId) {
      try {
        const eventsData = await brevoService.getEmailEventsByMessageId(normalizedMessageId);
        console.log('[PASS] STEP 5: Brevo event query completed.');
        console.log(`       - Events returned:`, eventsData);
      } catch (eventErr) {
        console.warn(`[WARN] STEP 5: Querying Brevo events returned: ${eventErr.message} (Note: Brevo event logs typically process within a few seconds of dispatch).`);
      }
    } else {
      console.log('[SKIP] STEP 5: No messageId available to query events.');
    }

    console.log('\n====================================================');
    console.log(' [ALL CHECKS PASSED] Bulk Email Flow is Operational! ');
    console.log('====================================================');
    process.exit(0);

  } catch (err) {
    console.error('Fatal unexpected error during test script:', err);
    process.exit(1);
  }
}

run();
