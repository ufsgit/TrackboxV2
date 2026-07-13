
const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

const paginate = (p, l) => ({ offset: (Math.max(1, +p || 1) - 1) * (Math.min(10000, +l || 1000)), limit: Math.min(10000, +l || 1000), page: Math.max(1, +p || 1) });

const getBroadcasts = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const bizId = req.user.businessId;
    let where = 'WHERE b.business_id = ?'; const params = [bizId];
    if (status) { where += ' AND b.status = ?'; params.push(status); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM broadcasts b ${where}`, params);
    const [rows] = await pool.query(
      `SELECT b.*, t.name as template_name FROM broadcasts b LEFT JOIN templates t ON b.template_id=t.id ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createBroadcast = async (req, res) => {
  try {
    const { name, template_id, target_tags, target_contact_ids, scheduled_at, channel } = req.body;
    const [result] = await pool.query(
      'INSERT INTO broadcasts (business_id, template_id, name, channel, target_tags, target_contact_ids, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, template_id, name, channel || 'whatsapp', JSON.stringify(target_tags || []), JSON.stringify(target_contact_ids || []), scheduled_at || null, scheduled_at ? 'scheduled' : 'draft']
    );
    const [rows] = await pool.query('SELECT * FROM broadcasts WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Broadcast created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getAudienceCount = async (req, res) => {
  try {
    const { tags, channel } = req.query;
    const bizId = req.user.businessId;
    let query = 'SELECT COUNT(*) as count FROM contacts WHERE business_id = ? AND opted_in = 1';
    const params = [bizId];

    const [[{ count }]] = await pool.query(query, params);

    // If tags are provided, we filter in memory or via JSON_CONTAINS if supported
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      const [rows] = await pool.query('SELECT tags FROM contacts WHERE business_id = ? AND opted_in = 1', [bizId]);
      const filteredCount = rows.filter(r => {
        let ct = r.tags;
        if (typeof ct === 'string') {
          try { ct = JSON.parse(ct); } catch (e) { ct = []; }
        }
        if (!Array.isArray(ct)) ct = [];
        return tagList.some(t => ct.includes(t));
      }).length;
      return res.json({ success: true, data: { count: filteredCount } });
    }

    res.json({ success: true, data: { count } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const sendBroadcast = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT b.*, t.name as tname, t.body as tbody, t.language as tlanguage FROM broadcasts b JOIN templates t ON b.template_id=t.id WHERE b.id=? AND b.business_id=?',
      [req.params.id, req.user.businessId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const broadcast = rows[0];
    
    // Prevent double sending
    if (broadcast.status === 'running' || broadcast.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Broadcast is already running or completed', data: null });
    }
    
    const channel = broadcast.channel || 'whatsapp';

    // Resolve contacts
    let contacts = [];
    const targetTags = typeof broadcast.target_tags === 'string' ? JSON.parse(broadcast.target_tags) : (broadcast.target_tags || []);
    const targetContactIds = typeof broadcast.target_contact_ids === 'string' ? JSON.parse(broadcast.target_contact_ids) : (broadcast.target_contact_ids || []);

    // Fetch all opted-in contacts for this business
    const [allContacts] = await pool.query('SELECT id, phone, tags FROM contacts WHERE business_id=? AND opted_in=1', [broadcast.business_id]);

    if (targetContactIds.length > 0) {
      contacts = allContacts.filter(c => targetContactIds.includes(c.id));
    } else if (targetTags.length > 0) {
      contacts = allContacts.filter(c => {
        let ct = c.tags;
        if (typeof ct === 'string') {
          try { ct = JSON.parse(ct); } catch (e) { ct = []; }
        }
        if (!Array.isArray(ct)) ct = [];
        return targetTags.some(t => ct.includes(t));
      });
    } else {
      contacts = allContacts;
    }

    await pool.query("UPDATE broadcasts SET status='running', started_at=NOW(), total_recipients=? WHERE id=?", [contacts.length, broadcast.id]);

    const WhatsappService = require('../services/WhatsappService');
    const InstagramService = require('../services/InstagramService');
    const FacebookService = require('../services/FacebookService');

    const io = req.app.get('io');
    let sent = 0, failed = 0;
    for (const contact of contacts) {
      let result;
      if (channel === 'instagram') {
        result = await InstagramService.sendTextMessage(contact.phone, broadcast.tbody, broadcast.business_id);
      } else if (channel === 'messenger') {
        result = await FacebookService.sendTextMessage(contact.phone, broadcast.tbody, broadcast.business_id);
      } else {
        result = await WhatsappService.sendTemplateMessage(contact.phone, broadcast.tname, broadcast.tlanguage || 'en', [], broadcast.business_id);
      }

      const status = result.success ? 'sent' : 'failed';
      if (result.success) sent++; else failed++;

      await pool.query(
        'INSERT INTO broadcast_logs (broadcast_id, contact_id, status, wa_message_id) VALUES (?, ?, ?, ?)',
        [broadcast.id, contact.id, status, result.data?.messages?.[0]?.id || result.data?.message_id || null]
      );

      if (result.success) {
        // Find or create conversation
        let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND status!='resolved' LIMIT 1", [broadcast.business_id, contact.id]);
        let convId;
        if (!convos.length) {
          const [resConv] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, last_message_at) VALUES (?, ?, ?, NOW())", [broadcast.business_id, contact.id, channel]);
          convId = resConv.insertId;
        } else {
          convId = convos[0].id;
          await pool.query('UPDATE conversations SET last_message_at=NOW() WHERE id=?', [convId]);
        }

        const msgContent = channel === 'whatsapp' ? `Broadcast Template: ${broadcast.tname}` : broadcast.tbody;
        const [msgResult] = await pool.query(
          'INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id, status) VALUES (?, \'outbound\', ?, ?, ?, ?)',
          [convId, msgContent, channel === 'whatsapp' ? 'template' : 'text', result.data?.messages?.[0]?.id || result.data?.message_id || null, status]
        );

        if (io) {
          const [newMsg] = await pool.query('SELECT * FROM messages WHERE id=?', [msgResult.insertId]);
          io.to(`biz_${broadcast.business_id}`).emit('new_message', { conversationId: convId, message: newMsg[0] });
          io.to(`biz_${broadcast.business_id}`).emit('conversation_updated', { conversationId: convId });
        }
      }
    }

    await pool.query(
      "UPDATE broadcasts SET status='completed', completed_at=NOW(), total_sent=?, total_failed=? WHERE id=?",
      [sent, failed, broadcast.id]
    );
    res.json({ success: true, data: { sent, failed, total: contacts.length }, message: 'Broadcast sent' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getBroadcastAnalytics = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM broadcasts WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const [logs] = await pool.query(
      'SELECT bl.*, c.name, c.phone FROM broadcast_logs bl JOIN contacts c ON bl.contact_id=c.id WHERE bl.broadcast_id=?',
      [req.params.id]
    );
    res.json({ success: true, data: { broadcast: rows[0], logs }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteBroadcast = async (req, res) => {
  try {
    await pool.query('DELETE FROM broadcasts WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getBroadcasts, createBroadcast, sendBroadcast, getBroadcastAnalytics, deleteBroadcast, getAudienceCount };

