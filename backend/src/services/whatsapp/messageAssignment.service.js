const pool = require('../../db/pool');
const { getPhoneVariants, parsePhoneAndCountryCode } = require('../../utils/whatsapp/phoneNormalizer');
const { createContact } = require('../../controllers/contacts.controller');

// =========================================================================
// DEFAULT CONFIGURATION FOR NEW LEADS CREATED VIA WHATSAPP QR
// (Arranged in the exact column order of the `contacts` table DDL)
// Modify any of these default fallback values anytime.
// =========================================================================
const WHATSAPP_LEAD_DEFAULTS = {
  // id: Auto-increment
  // business_id: Set dynamically from session/staff
  // name: Set dynamically from WhatsApp pushName or phone
  // phone: Set dynamically (10 digits)
  // country_code: Set dynamically from the WhatsApp sender's country code
  // email: Set dynamically from WhatsApp if exists, else NULL
  tags: ['whatsapp-qr'],                               // `tags` json DEFAULT NULL
  opted_in: 1,                                         // `opted_in` tinyint(1) DEFAULT '0'
  opt_in_date: new Date(),                             // `opt_in_date` timestamp NULL DEFAULT NULL
  opt_out_date: null,                                  // `opt_out_date` timestamp NULL DEFAULT NULL
  opt_in_source: 'whatsapp',                           // `opt_in_source` enum('manual','link','whatsapp','import') DEFAULT 'manual'
  channel_preference: 'whatsapp',                      // `channel_preference` varchar(100) DEFAULT 'whatsapp'
  has_unread_wa: 1,                                    // `has_unread_wa` tinyint(1) DEFAULT '0'
  // created_at: Defaults to CURRENT_TIMESTAMP
  // assigned_to: Set dynamically to current staff user ID
  // address: Set dynamically from WhatsApp if exists, else NULL
  enquiry_for_id: null,                                // `enquiry_for_id` int DEFAULT NULL
  loss_reason: null,                                   // `loss_reason` varchar(255) DEFAULT NULL
  // branch_id: Inherited dynamically from assigned staff
  // branch_name: Inherited dynamically from assigned staff
  // department_id: Inherited dynamically from assigned staff
  // department_name: Inherited dynamically from assigned staff
  status_id: 3,                                        // `status_id` int DEFAULT NULL (3: 'pending')
  status_name: 'pending',                              // `status_name` varchar(100) DEFAULT NULL
  follow_up_count: 0,                                  // `follow_up_count` int DEFAULT '0'
  follow_up_date: () => new Date(),                    // `follow_up_date` date DEFAULT NULL (current date)
  follow_up: 1,                                        // `follow_up` tinyint(1) DEFAULT '0'
  sale_won: 0,                                         // `sale_won` tinyint(1) DEFAULT '0'
  sale_won_date: null,                                 // `sale_won_date` datetime DEFAULT NULL
  sale_won_by: null,                                   // `sale_won_by` int DEFAULT NULL
  sale_lost: 0,                                        // `sale_lost` tinyint(1) DEFAULT '0'
  sale_lost_date: null,                                // `sale_lost_date` datetime DEFAULT NULL
  sale_lost_by: null,                                  // `sale_lost_by` int DEFAULT NULL
  // created_by_user: Set dynamically to current staff user ID
  user_list: null,                                     // `user_list` json DEFAULT NULL
  priority: 'Medium',                                  // `priority` enum('High','Medium','Low') DEFAULT NULL
  probability_id: null,                                // `probability_id` int DEFAULT NULL
  current_sale_status: 0,                              // `current_sale_status` int DEFAULT '0'
  remark: 'Lead created via WhatsApp QR'               // Initial follow-up note
};

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
    const { from, text, pushName, timestamp, messageId, email, address } = messageData;
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

      // Create contact using createContact from contacts.controller
      const newContact = await createContact({
        business_id: businessId || 1,
        name: pushName || tenDigitPhone,
        phone: tenDigitPhone,
        country_code: countryCode || WHATSAPP_LEAD_DEFAULTS.country_code,
        email: email || WHATSAPP_LEAD_DEFAULTS.email,
        tags: WHATSAPP_LEAD_DEFAULTS.tags,
        opted_in: WHATSAPP_LEAD_DEFAULTS.opted_in,
        opt_in_date: WHATSAPP_LEAD_DEFAULTS.opt_in_date,
        opt_out_date: WHATSAPP_LEAD_DEFAULTS.opt_out_date,
        opt_in_source: WHATSAPP_LEAD_DEFAULTS.opt_in_source,
        channel_preference: WHATSAPP_LEAD_DEFAULTS.channel_preference,
        has_unread_wa: WHATSAPP_LEAD_DEFAULTS.has_unread_wa,
        assigned_to: userId,
        address: address || WHATSAPP_LEAD_DEFAULTS.address,
        enquiry_for_id: WHATSAPP_LEAD_DEFAULTS.enquiry_for_id,
        loss_reason: WHATSAPP_LEAD_DEFAULTS.loss_reason,
        branch_id: branchId,
        branch_name: branchName,
        department_id: departmentId,
        department_name: departmentName,
        status_id: WHATSAPP_LEAD_DEFAULTS.status_id,
        status_name: WHATSAPP_LEAD_DEFAULTS.status_name,
        follow_up_count: WHATSAPP_LEAD_DEFAULTS.follow_up_count,
        follow_up_date: typeof WHATSAPP_LEAD_DEFAULTS.follow_up_date === 'function' ? WHATSAPP_LEAD_DEFAULTS.follow_up_date() : (WHATSAPP_LEAD_DEFAULTS.follow_up_date || new Date()),
        follow_up: WHATSAPP_LEAD_DEFAULTS.follow_up,
        sale_won: WHATSAPP_LEAD_DEFAULTS.sale_won,
        sale_won_date: WHATSAPP_LEAD_DEFAULTS.sale_won_date,
        sale_won_by: WHATSAPP_LEAD_DEFAULTS.sale_won_by,
        sale_lost: WHATSAPP_LEAD_DEFAULTS.sale_lost,
        sale_lost_date: WHATSAPP_LEAD_DEFAULTS.sale_lost_date,
        sale_lost_by: WHATSAPP_LEAD_DEFAULTS.sale_lost_by,
        created_by_user: userId,
        user_list: WHATSAPP_LEAD_DEFAULTS.user_list,
        priority: WHATSAPP_LEAD_DEFAULTS.priority,
        probability_id: WHATSAPP_LEAD_DEFAULTS.probability_id,
        current_sale_status: WHATSAPP_LEAD_DEFAULTS.current_sale_status,
        remark: WHATSAPP_LEAD_DEFAULTS.remark
      });

      contactId = newContact.id;
      console.log(`[Message Assignment] New contact created via contacts controller: Contact ID: ${contactId}, Name: ${newContact.name}, Phone: ${tenDigitPhone}, Country Code: ${countryCode}, Branch: ${branchName || 'N/A'}, Dept: ${departmentName || 'N/A'}, Assigned To User: ${userId}`);
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
    const [insertResult] = await pool.query(
      `INSERT INTO whatsapp_messages 
       (business_id, contact_id, user_id, session_id, direction, wa_message_id, message, status, sent_at)
       VALUES (?, ?, ?, ?, 'inbound', ?, ?, 'delivered', ?)`,
      [businessId || 1, contactId, userId, sessionId, messageId || null, text.trim(), sentAt]
    );

    // 4. Update contact has_unread_wa flag
    await pool.query('UPDATE contacts SET has_unread_wa = 1 WHERE id = ?', [contactId]);

    console.log(`[Message Assignment] Inbound WhatsApp message successfully saved to whatsapp_messages for contact ${contactId}`);

    // 5. Notify via global Socket.IO
    try {
      const { getWhatsappQrIO } = require('../../sockets/whatsapp/whatsappQr.socket');
      const io = getWhatsappQrIO();
      if (io) {
        io.to(`biz_${businessId || 1}`).emit('whatsapp_unread_changed', {
          contactId,
          has_unread_wa: 1,
          message: text.trim(),
          assigned_to: userId
        });
        io.emit('whatsapp_unread_changed', {
          contactId,
          has_unread_wa: 1,
          message: text.trim(),
          assigned_to: userId
        });
      }
    } catch (socketErr) {
      console.warn('[Message Assignment] Socket emission error:', socketErr.message);
    }
  } catch (error) {
    console.error('[Message Assignment] Error storing message in whatsapp_messages:', error);
  }
}

module.exports = {
  assignIncomingMessage
};

