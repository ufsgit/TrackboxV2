const pool = require('../db/pool');

/**
 * Handle Brevo transactional email webhooks
 * Supported Brevo events:
 * - 'request' / 'sent' -> status: 'queued', last_event
 * - 'delivered' -> status: 'delivered', delivered_at
 * - 'unique_opened' / 'opened' -> status: 'opened', opened_at
 * - 'click' -> status: 'clicked', clicked_at
 * - 'soft_bounce' -> status: 'soft_bounce', bounce_reason
 * - 'hard_bounce' -> status: 'hard_bounce', bounce_reason
 * - 'blocked' -> status: 'blocked', bounce_reason
 * - 'spam' -> status: 'spam'
 * - 'invalid_email' -> status: 'invalid_email'
 * - 'deferred' -> status: 'deferred', bounce_reason
 * - 'unsubscribed' -> status: 'unsubscribed'
 */
const STATUS_PRIORITY = {
  'queued': 1,
  'deferred': 2,
  'delivered': 3,
  'opened': 4,
  'clicked': 5,
  'soft_bounce': 3,
  'hard_bounce': 4,
  'blocked': 4,
  'spam': 4,
  'invalid_email': 4,
  'unsubscribed': 4,
  'failed': 4
};

const handleBrevoWebhook = async (req, res, io) => {
  try {
    const payload = req.body;
    console.log('[Brevo Webhook] Received event:', JSON.stringify(payload));

    if (!payload) {
      return res.status(200).json({ received: true });
    }

    // Payload can be a single event object or an array of event objects
    const events = Array.isArray(payload) ? payload : [payload];

    for (const item of events) {
      const eventType = (item.event || '').toLowerCase();
      const rawMessageId = item['message-id'] || item.messageId || item.msg_id;
      const email = item.email ? String(item.email).trim() : null;
      const reason = item.reason || item.description || item.error || null;

      // Normalize Brevo message ID: strip angle brackets < > and whitespace
      const cleanMessageId = rawMessageId ? String(rawMessageId).replace(/[<>]/g, '').trim() : null;

      if (!cleanMessageId && !email) {
        continue;
      }

      let newStatus = null;
      let timestampCol = null;

      switch (eventType) {
        case 'request':
        case 'sent':
          newStatus = 'queued';
          break;
        case 'delivered':
          newStatus = 'delivered';
          timestampCol = 'delivered_at';
          break;
        case 'opened':
        case 'unique_opened':
          newStatus = 'opened';
          timestampCol = 'opened_at';
          break;
        case 'click':
          newStatus = 'clicked';
          timestampCol = 'clicked_at';
          break;
        case 'soft_bounce':
          newStatus = 'soft_bounce';
          break;
        case 'hard_bounce':
        case 'bounce':
          newStatus = 'hard_bounce';
          break;
        case 'blocked':
          newStatus = 'blocked';
          break;
        case 'spam':
          newStatus = 'spam';
          break;
        case 'invalid_email':
          newStatus = 'invalid_email';
          break;
        case 'deferred':
          newStatus = 'deferred';
          break;
        case 'unsubscribed':
          newStatus = 'unsubscribed';
          break;
        case 'error':
        case 'failed':
          newStatus = 'failed';
          break;
        default:
          break;
      }

      // Fetch matching record to check status hierarchy (prevent downgrade e.g. opened overwritten by delivered)
      let matchedRows = [];
      if (cleanMessageId) {
        [matchedRows] = await pool.query(
          `SELECT id, business_id, contact_id, status FROM lead_emails 
           WHERE brevo_message_id LIKE ? OR brevo_message_id = ? 
           ORDER BY id DESC LIMIT 1`,
          [`%${cleanMessageId}%`, cleanMessageId]
        );
      }

      if ((!matchedRows || matchedRows.length === 0) && email) {
        [matchedRows] = await pool.query(
          `SELECT id, business_id, contact_id, status FROM lead_emails 
           WHERE to_email = ? 
           ORDER BY id DESC LIMIT 1`,
          [email]
        );
      }

      if (matchedRows && matchedRows.length > 0) {
        const currentRecord = matchedRows[0];
        const currentStatus = currentRecord.status || 'queued';

        let targetStatus = currentStatus;
        if (newStatus) {
          const currentRank = STATUS_PRIORITY[currentStatus] || 0;
          const newRank = STATUS_PRIORITY[newStatus] || 0;
          // Only upgrade or maintain terminal status
          if (newRank >= currentRank || currentStatus === 'queued' || currentStatus === 'deferred') {
            targetStatus = newStatus;
          }
        }

        let updateSql = `
          UPDATE lead_emails 
          SET status = ?,
              last_event = ?,
              last_event_at = NOW(),
              bounce_reason = COALESCE(?, bounce_reason),
              updated_at = NOW()
        `;
        const updateParams = [targetStatus, eventType, reason];

        if (timestampCol) {
          updateSql += `, ${timestampCol} = COALESCE(${timestampCol}, NOW())`;
        }

        updateSql += ` WHERE id = ?`;
        updateParams.push(currentRecord.id);

        await pool.query(updateSql, updateParams);

        // Emit socket event to business room and global listeners
        if (io) {
          const payloadData = {
            contactId: currentRecord.contact_id,
            email,
            status: targetStatus,
            lastEvent: eventType,
            reason: reason || null,
            messageId: cleanMessageId
          };
          if (currentRecord.business_id) {
            io.to(`biz_${currentRecord.business_id}`).emit('email_status_updated', payloadData);
          }
          io.emit('email_status_updated', payloadData);
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Brevo webhook processed' });
  } catch (error) {
    console.error('[Brevo Webhook] Error processing event:', error);
    return res.status(200).json({ success: false, error: error.message });
  }
};

module.exports = {
  handleBrevoWebhook
};
