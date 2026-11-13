const pool = require('../../db/pool');
const { getPhoneVariants, parsePhoneAndCountryCode } = require('../../utils/whatsapp/phoneNormalizer');

/**
 * Handles incoming messages from the Baileys client and assigns them
 * to the staff user associated with the active session into whatsapp_messages.
 */
async function assignIncomingMessage({ sessionId, userId, businessId, messageData }) {
  if (!userId) {
    console.warn(`[Message Assignment] Incoming message for session ${sessionId} dropped: No user assigned.`);
    return;
  }

  try {
    const { from, text, pushName, timestamp, messageId } = messageData;
    if (!text || text.trim() === '') {
      return; // Only store text messages
    }

    // Normalize customer phone (strip @s.whatsapp.net etc)
    const rawCustomerPhone = String(from).replace(/@.+/, '');
    const { phone: tenDigitPhone, countryCode } = parsePhoneAndCountryCode(rawCustomerPhone);
    const phoneVariants = getPhoneVariants(rawCustomerPhone);

    // 1. Check if contact already exists in contacts table using phone variants
    let contactId = null;
    let existingContact = null;

    if (phoneVariants.length > 0) {
      const placeholders = phoneVariants.map(() => '?').join(',');
      const [existingContacts] = await pool.query(
        `SELECT id, assigned_to, name, phone, branch_id, department_id FROM contacts 
         WHERE (phone IN (${placeholders}) OR RIGHT(phone, 10) IN (${placeholders}))
         AND business_id = ? 
         LIMIT 1`,
        [...phoneVariants, ...phoneVariants, businessId || 1]
      );

      if (existingContacts.length > 0) {
        existingContact = existingContacts[0];
        contactId = existingContact.id;
      }
    }

    // CASE A: EXISTING CUSTOMER
    if (contactId) {
      // ONLY process if this contact is assigned to THIS staff member (userId)
      if (String(existingContact.assigned_to) !== String(userId)) {
        console.log(`[Message Assignment] Ignored: Contact ID: ${contactId}, Name: ${existingContact.name}, Phone: ${existingContact.phone} is assigned to User ${existingContact.assigned_to}, not current staff User ${userId}.`);
        return; // Do nothing at all for existing contacts assigned to others or unassigned
      }

      console.log(`[Message Assignment] Existing contact matched and verified: Contact ID: ${contactId}, Name: ${existingContact.name}, Phone: ${existingContact.phone}, Assigned To User: ${existingContact.assigned_to}`);
    } 
    // CASE B: NEW CUSTOMER (Not in contacts table)
    else {
      // Fetch staff user's branch and department details
      const [staffRows] = await pool.query(
        `SELECT u.id, u.branch_id, b.name as branch_name, u.department_id, d.name as department_name
         FROM users u
         LEFT JOIN branches b ON u.branch_id = b.id
         LEFT JOIN departments d ON u.department_id = d.id
         WHERE u.id = ? LIMIT 1`,
        [userId]
      );

      const staff = staffRows[0] || {};
      const branchId = staff.branch_id || null;
      const branchName = staff.branch_name || null;
      const departmentId = staff.department_id || null;
      const departmentName = staff.department_name || null;

      const [insertContact] = await pool.query(
        `INSERT INTO contacts 
         (business_id, name, phone, country_code, email, tags, opted_in, assigned_to, 
          branch_id, branch_name, department_id, department_name, opt_in_source, channel_preference) 
         VALUES (?, ?, ?, ?, NULL, ?, 1, ?, ?, ?, ?, ?, 'whatsapp', 'whatsapp')`,
        [
          businessId || 1,
          pushName || tenDigitPhone,
          tenDigitPhone,
          countryCode || '+91',
          JSON.stringify(['whatsapp-qr']),
          userId,
          branchId,
          branchName,
          departmentId,
          departmentName
        ]
      );
      contactId = insertContact.insertId;
      console.log(`[Message Assignment] New contact created: Contact ID: ${contactId}, Name: ${pushName || tenDigitPhone}, Phone: ${tenDigitPhone}, Country Code: ${countryCode}, Branch: ${branchName || 'N/A'}, Dept: ${departmentName || 'N/A'}, Assigned To User: ${userId}`);
    }

    // 2. Prevent duplicate messages if already inserted (using wa_message_id)
    if (messageId) {
      const [dupCheck] = await pool.query(
        'SELECT id FROM whatsapp_messages WHERE wa_message_id = ? LIMIT 1',
        [messageId]
      );
      if (dupCheck.length > 0) {
        return; // Already recorded
      }
    }

    // 3. Insert message into whatsapp_messages table
    const sentAt = timestamp ? new Date(timestamp) : new Date();
    await pool.query(
      `INSERT INTO whatsapp_messages 
       (business_id, contact_id, user_id, session_id, direction, wa_message_id, message, status, sent_at)
       VALUES (?, ?, ?, ?, 'inbound', ?, ?, 'delivered', ?)`,
      [businessId || 1, contactId, userId, sessionId, messageId || null, text.trim(), sentAt]
    );

    console.log(`[Message Assignment] Inbound WhatsApp message successfully saved to whatsapp_messages for contact ${contactId}`);
  } catch (error) {
    console.error('[Message Assignment] Error storing message in whatsapp_messages:', error);
  }
}

module.exports = {
  assignIncomingMessage
};

