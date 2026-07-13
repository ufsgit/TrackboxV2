const cron = require('node-cron');
const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

// Every 5 minutes: process drip enrollment steps
function startDripJob(io) {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const [enrollments] = await pool.query(
        "SELECT de.*, dc.steps, dc.business_id, c.phone FROM drip_enrollments de " +
        "JOIN drip_campaigns dc ON de.campaign_id=dc.id " +
        "JOIN contacts c ON de.contact_id=c.id " +
        "WHERE de.status='active' AND de.next_send_at <= NOW() AND dc.is_active=1"
      );

      for (const enrollment of enrollments) {
        const steps = enrollment.steps || [];
        const currentStep = enrollment.current_step;
        if (currentStep >= steps.length) {
          await pool.query("UPDATE drip_enrollments SET status='completed' WHERE id=?", [enrollment.id]);
          continue;
        }

        const step = steps[currentStep];
        // Send message
        let result;
        let content;
        let msgType;
        if (step.template_id) {
          const [templates] = await pool.query('SELECT name, language FROM templates WHERE id=?', [step.template_id]);
          if (templates.length) {
            content = `Drip Template: ${templates[0].name}`;
            msgType = 'template';
            result = await WhatsappService.sendTemplateMessage(enrollment.phone, templates[0].name, templates[0].language || 'en', [], enrollment.business_id);
          }
        } else if (step.message) {
          content = step.message;
          msgType = 'text';
          result = await WhatsappService.sendTextMessage(enrollment.phone, step.message, enrollment.business_id);
        }

        if (result && result.success) {
          // Find or create conversation
          let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND status!='resolved' LIMIT 1", [enrollment.business_id, enrollment.contact_id]);
          let convId;
          if (!convos.length) {
            const [resConv] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, last_message_at) VALUES (?, ?, 'whatsapp', NOW())", [enrollment.business_id, enrollment.contact_id]);
            convId = resConv.insertId;
          } else {
            convId = convos[0].id;
            await pool.query('UPDATE conversations SET last_message_at=NOW() WHERE id=?', [convId]);
          }

          const [msgResult] = await pool.query(
            'INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id, status) VALUES (?, \'outbound\', ?, ?, ?, ?)',
            [convId, content, msgType, result.data?.messages?.[0]?.id || null, 'sent']
          );

          if (io) {
            const [newMsg] = await pool.query('SELECT * FROM messages WHERE id=?', [msgResult.insertId]);
            io.to(`biz_${enrollment.business_id}`).emit('new_message', { conversationId: convId, message: newMsg[0] });
            io.to(`biz_${enrollment.business_id}`).emit('conversation_updated', { conversationId: convId });
          }
        }

        // Advance step
        const nextStep = currentStep + 1;
        if (nextStep >= steps.length) {
          await pool.query("UPDATE drip_enrollments SET status='completed', current_step=? WHERE id=?", [nextStep, enrollment.id]);
        } else {
          const nextDelay = steps[nextStep].delay_hours || 24;
          const nextSend = new Date(Date.now() + nextDelay * 3600000);
          await pool.query("UPDATE drip_enrollments SET current_step=?, next_send_at=? WHERE id=?", [nextStep, nextSend, enrollment.id]);
        }
      }
    } catch (err) { console.error('Drip job error:', err.message); }
  });
  console.log('💧 Drip campaign scheduler started');
}
module.exports = { startDripJob };
