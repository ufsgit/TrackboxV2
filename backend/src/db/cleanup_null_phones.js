const pool = require('./pool');
const { normalizePhone } = require('../utils/phoneHelper');

async function extractPhoneFromWamid(waMessageId) {
  if (!waMessageId || !waMessageId.startsWith('wamid.HBgM')) return null;
  try {
    const base64Part = waMessageId.substring(10, 34); // typical length for base64 phone 
    // actually, let's just decode the rest of the string and look for the phone number
    const decoded = Buffer.from(waMessageId.substring(10), 'base64').toString('ascii');
    const match = decoded.match(/\d{10,15}/);
    if (match) {
      return normalizePhone(match[0]);
    }
  } catch (err) {
    console.error(`Error decoding wa_message_id ${waMessageId}:`, err);
  }
  return null;
}

async function cleanupNullPhones() {
  console.log('Starting cleanup of NULL or empty phone contacts...');
  
  // 1. Fetch contacts with NULL or empty phone
  const [contacts] = await pool.query('SELECT * FROM contacts WHERE phone IS NULL OR phone = ""');
  console.log(`Found ${contacts.length} contacts with NULL or empty phone numbers.`);

  for (const contact of contacts) {
    console.log(`\nProcessing contact ID: ${contact.id}, Name: ${contact.name}`);
    const bizId = contact.business_id;
    let extractedPhone = null;

    // Check if they have associated conversations and messages
    const [convos] = await pool.query('SELECT id, channel FROM conversations WHERE contact_id=?', [contact.id]);
    for (const convo of convos) {
      // Find the first inbound message with a wa_message_id
      const [messages] = await pool.query('SELECT wa_message_id FROM messages WHERE conversation_id=? AND direction="inbound" AND wa_message_id IS NOT NULL LIMIT 1', [convo.id]);
      if (messages.length > 0) {
        extractedPhone = await extractPhoneFromWamid(messages[0].wa_message_id);
        if (extractedPhone) break;
      }
    }

    if (extractedPhone) {
      console.log(`Extracted phone number: ${extractedPhone}`);
      
      // Check if another contact exists with this phone number
      const [existingContacts] = await pool.query('SELECT id, name FROM contacts WHERE business_id=? AND phone=? AND id != ? LIMIT 1', [bizId, extractedPhone, contact.id]);
      
      if (existingContacts.length > 0) {
        const existing = existingContacts[0];
        console.log(`Found existing contact ID: ${existing.id} with this phone. Merging...`);

        // If existing contact doesn't have a name, but the duplicate does, copy it
        if ((!existing.name || existing.name === 'Unknown' || existing.name === 'null') && (contact.name && contact.name !== 'Unknown' && contact.name !== 'null')) {
            await pool.query('UPDATE contacts SET name=? WHERE id=?', [contact.name, existing.id]);
        }

        // Merge references
        await pool.query('UPDATE conversations SET contact_id=? WHERE contact_id=?', [existing.id, contact.id]);
        await pool.query('UPDATE orders SET contact_id=? WHERE contact_id=?', [existing.id, contact.id]);
        await pool.query('UPDATE chatbot_sessions SET contact_id=? WHERE contact_id=?', [existing.id, contact.id]);
        await pool.query('UPDATE drip_enrollments SET contact_id=? WHERE contact_id=?', [existing.id, contact.id]);
        await pool.query('UPDATE broadcast_logs SET contact_id=? WHERE contact_id=?', [existing.id, contact.id]);

        // Consolidate duplicate conversations
        const [allConvos] = await pool.query('SELECT id, channel FROM conversations WHERE contact_id=?', [existing.id]);
        const channelMap = {};
        for (const c of allConvos) {
          if (!channelMap[c.channel]) {
            channelMap[c.channel] = c;
          } else {
            // Duplicate conversation for the same channel, merge messages
            const primaryConvoId = channelMap[c.channel].id;
            const duplicateConvoId = c.id;
            await pool.query('UPDATE messages SET conversation_id=? WHERE conversation_id=?', [primaryConvoId, duplicateConvoId]);
            await pool.query('UPDATE orders SET conversation_id=? WHERE conversation_id=?', [primaryConvoId, duplicateConvoId]);
            await pool.query('DELETE FROM conversations WHERE id=?', [duplicateConvoId]);
            console.log(`Merged conversation ID ${duplicateConvoId} into ${primaryConvoId}`);
          }
        }

        // Finally, delete the duplicate contact
        await pool.query('DELETE FROM contacts WHERE id=?', [contact.id]);
        console.log(`Deleted duplicate contact ID: ${contact.id}`);
        
      } else {
        // No existing contact, just update the phone number
        await pool.query('UPDATE contacts SET phone=? WHERE id=?', [extractedPhone, contact.id]);
        console.log(`Updated contact ID: ${contact.id} with phone ${extractedPhone}`);
      }
    } else {
      console.log(`Could not extract phone number. Deleting contact ID: ${contact.id}`);
      // Delete everything related to this dummy/invalid contact
      for (const convo of convos) {
        await pool.query('DELETE FROM messages WHERE conversation_id=?', [convo.id]);
        await pool.query('DELETE FROM orders WHERE conversation_id=?', [convo.id]);
        await pool.query('DELETE FROM conversations WHERE id=?', [convo.id]);
      }
      await pool.query('DELETE FROM chatbot_sessions WHERE contact_id=?', [contact.id]);
      await pool.query('DELETE FROM drip_enrollments WHERE contact_id=?', [contact.id]);
      await pool.query('DELETE FROM broadcast_logs WHERE contact_id=?', [contact.id]);
      await pool.query('DELETE FROM orders WHERE contact_id=?', [contact.id]);
      
      await pool.query('DELETE FROM contacts WHERE id=?', [contact.id]);
      console.log(`Deleted junk contact ID: ${contact.id} and its associated data.`);
    }
  }

  console.log('Cleanup completed successfully.');
  process.exit(0);
}

cleanupNullPhones().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
