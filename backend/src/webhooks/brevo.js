const pool = require('../db/pool');

/**
 * Handle Brevo transactional email webhooks
 * Supported Brevo events:
 * - 'delivered' -> CRM status: 'delivered'
 * - 'opened' / 'unique_opened' -> CRM status: 'opened'
 * - 'click' -> CRM status: 'clicked'
 * - 'soft_bounce' / 'hard_bounce' -> CRM status: 'bounced'
 * - 'blocked' / 'spam' / 'invalid_email' -> CRM status: 'blocked'
 * - 'error' -> CRM status: 'failed'
 */
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
      // Brevo message-id can appear as 'message-id', 'messageId', or 'msg_id'
      const messageId = item['message-id'] || item.messageId || item.msg_id;
      const email = item.email;
      const reason = item.reason || item.description || item.error || null;

      if (!messageId && !email) {
        continue;
      }

      let crmStatus = null;
      if (eventType === 'delivered') {
        crmStatus = 'delivered';
      } else if (eventType === 'opened' || eventType === 'unique_opened') {
        crmStatus = 'opened';
      } else if (eventType === 'click') {
        crmStatus = 'clicked';
      } else if (eventType === 'soft_bounce' || eventType === 'hard_bounce' || eventType === 'bounce') {
        crmStatus = 'bounced';
      } else if (eventType === 'blocked' || eventType === 'spam' || eventType === 'invalid_email') {
        crmStatus = 'blocked';
      } else if (eventType === 'error') {
        crmStatus = 'failed';
      }

      if (!crmStatus) {
        continue;
      }

      // Update lead_emails record by brevo_message_id
      // Clean messageId (strip angle brackets < > if present)
      const cleanMessageId = messageId ? messageId.replace(/[<>]/g, '').trim() : null;

      let updateResult;
      if (cleanMessageId) {
        [updateResult] = await pool.query(
          `UPDATE lead_emails 
           SET status = ?, bounce_reason = COALESCE(?, bounce_reason), updated_at = NOW() 
           WHERE brevo_message_id LIKE ? OR brevo_message_id = ?`,
          [crmStatus, reason, `%${cleanMessageId}%`, cleanMessageId]
        );
      }

      // Fallback by email and most recent record if messageId did not match
      if ((!updateResult || updateResult.affectedRows === 0) && email) {
        await pool.query(
          `UPDATE lead_emails 
           SET status = ?, bounce_reason = COALESCE(?, bounce_reason), updated_at = NOW() 
           WHERE to_email = ? 
           ORDER BY id DESC LIMIT 1`,
          [crmStatus, reason, email.trim()]
        );
      }

      // Notify clients via socket.io if initialized
      if (io) {
        io.emit('email_status_updated', {
          messageId: cleanMessageId,
          email,
          status: crmStatus,
          reason
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Brevo webhook processed' });
  } catch (error) {
    console.error('[Brevo Webhook] Error processing event:', error);
    // Return 200 so Brevo doesn't infinitely retry failed webhooks
    return res.status(200).json({ success: false, error: error.message });
  }
};

module.exports = {
  handleBrevoWebhook
};
