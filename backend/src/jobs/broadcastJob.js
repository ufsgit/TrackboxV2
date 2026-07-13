const cron = require('node-cron');
const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

// Every minute: check scheduled broadcasts
function startBroadcastJob(io) {
  cron.schedule('* * * * *', async () => {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM broadcasts WHERE status='scheduled' AND scheduled_at <= NOW()"
      );
      for (const broadcast of rows) {
        await pool.query("UPDATE broadcasts SET status='running', started_at=NOW() WHERE id=?", [broadcast.id]);

        const tags = broadcast.target_tags || [];
        const contactIds = broadcast.target_contact_ids || [];
        let contacts = [];
        if (tags.length) {
          const [all] = await pool.query('SELECT id, phone, tags FROM contacts WHERE business_id=? AND opted_in=1', [broadcast.business_id]);
          contacts.push(...all.filter(c => (c.tags || []).some(t => tags.includes(t))));
        }
        if (contactIds.length) {
          const [ids] = await pool.query('SELECT id, phone FROM contacts WHERE id IN (?) AND opted_in=1', [contactIds]);
          contacts.push(...ids);
        }
        const seen = new Set();
        contacts = contacts.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });

        const [templates] = await pool.query('SELECT name, language FROM templates WHERE id=?', [broadcast.template_id]);
        const tName = templates[0]?.name;
        const tLang = templates[0]?.language || 'en';
        await pool.query('UPDATE broadcasts SET total_recipients=? WHERE id=?', [contacts.length, broadcast.id]);

        let sent = 0, failed = 0;
        for (const contact of contacts) {
          const result = await WhatsappService.sendTemplateMessage(contact.phone, tName, tLang, [], broadcast.business_id);
          const status = result.success ? 'sent' : 'failed';
          if (result.success) sent++; else failed++;
          await pool.query(
            'INSERT INTO broadcast_logs (broadcast_id, contact_id, status, wa_message_id) VALUES (?, ?, ?, ?)',
            [broadcast.id, contact.id, status, result.data?.messages?.[0]?.id || null]
          );

          if (result.success) {
            // Find or create conversation
            let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND status!='resolved' LIMIT 1", [broadcast.business_id, contact.id]);
            let convId;
            if (!convos.length) {
              const [resConv] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, last_message_at) VALUES (?, ?, 'whatsapp', NOW())", [broadcast.business_id, contact.id]);
              convId = resConv.insertId;
            } else {
              convId = convos[0].id;
              await pool.query('UPDATE conversations SET last_message_at=NOW() WHERE id=?', [convId]);
            }

            const [msgResult] = await pool.query(
              'INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id, status) VALUES (?, \'outbound\', ?, \'template\', ?, ?)',
              [convId, `Broadcast Template: ${tName}`, result.data?.messages?.[0]?.id || null, status]
            );

            if (io) {
              const [newMsg] = await pool.query('SELECT * FROM messages WHERE id=?', [msgResult.insertId]);
              io.to(`biz_${broadcast.business_id}`).emit('new_message', { conversationId: convId, message: newMsg[0] });
              io.to(`biz_${broadcast.business_id}`).emit('conversation_updated', { conversationId: convId });
            }
          }
        }
        await pool.query("UPDATE broadcasts SET status='completed', completed_at=NOW(), total_sent=?, total_failed=? WHERE id=?", [sent, failed, broadcast.id]);
      }
    } catch (err) { console.error('Broadcast job error:', err.message); }
  });
  console.log('📡 Broadcast scheduler started');
}
module.exports = { startBroadcastJob };
