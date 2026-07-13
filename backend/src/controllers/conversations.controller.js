const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

const paginate = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(10000, parseInt(limit) || 1000);
  return { offset: (p - 1) * l, limit: l, page: p };
};

const getConversations = async (req, res) => {
  try {
    const { page, limit, status, channel, assigned_to, search } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const bizId = req.user.businessId;

    let where = 'WHERE c.business_id = ?';
    const params = [bizId];
    if (status) { where += ' AND c.status = ?'; params.push(status); }
    if (channel) { where += ' AND c.channel = ?'; params.push(channel); }
    if (req.user.role === 'agent') {
      where += ' AND c.assigned_to = ?';
      params.push(req.user.userId);
    } else {
      if (assigned_to === 'me') { where += ' AND c.assigned_to = ?'; params.push(req.user.userId); }
      else if (assigned_to) { where += ' AND c.assigned_to = ?'; params.push(assigned_to); }
    }
    if (search) {
      where += ' AND (co.name LIKE ? OR co.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM conversations c LEFT JOIN contacts co ON c.contact_id = co.id ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT c.*, co.name as contact_name, co.phone as contact_phone, co.opted_in,
        u.name as assigned_name,
        (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.sent_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.direction = 'inbound') as unread_count
       FROM conversations c
       LEFT JOIN contacts co ON c.contact_id = co.id
       LEFT JOIN users u ON c.assigned_to = u.id
       ${where} ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getMessages = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);

    if (req.user.role === 'agent') {
      const [convCheck] = await pool.query('SELECT id FROM conversations WHERE id = ? AND business_id = ? AND assigned_to = ?', [req.params.id, req.user.businessId, req.user.userId]);
      if (!convCheck.length) return res.status(403).json({ success: false, message: 'Access denied', data: null });
    } else {
      const [convCheck] = await pool.query('SELECT id FROM conversations WHERE id = ? AND business_id = ?', [req.params.id, req.user.businessId]);
      if (!convCheck.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    }

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?', [req.params.id]);
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC LIMIT ? OFFSET ?',
      [req.params.id, lim, offset]
    );
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, message_type, media_url } = req.body;
    const convId = req.params.id;

    const [convRows] = await pool.query(
      'SELECT c.*, co.phone FROM conversations c JOIN contacts co ON c.contact_id = co.id WHERE c.id = ?',
      [convId]
    );
    if (!convRows.length) return res.status(404).json({ success: false, message: 'Conversation not found', data: null });
    const conv = convRows[0];

    if (conv.business_id !== req.user.businessId || (req.user.role === 'agent' && conv.assigned_to !== req.user.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied', data: null });
    }

    const WhatsappService = require('../services/WhatsappService');
    const InstagramService = require('../services/InstagramService');
    const FacebookService = require('../services/FacebookService');

    let fullMediaUrl = media_url;
    if (media_url && media_url.startsWith('/')) {
      let host = req.headers['x-forwarded-host'] || req.get('host');
      let protocol = req.headers['x-forwarded-proto'] || req.protocol;
      
      // If requested locally, fetch the ngrok public URL so Meta can access the file
      if (host.includes('localhost') || host.includes('127.0.0.1')) {
        try {
          const axios = require('axios');
          const ngrokRes = await axios.get('http://127.0.0.1:4040/api/tunnels');
          if (ngrokRes.data && ngrokRes.data.tunnels && ngrokRes.data.tunnels.length > 0) {
            const publicUrl = ngrokRes.data.tunnels[0].public_url;
            host = publicUrl.replace(/^https?:\/\//, '');
            protocol = publicUrl.startsWith('https') ? 'https' : 'http';
          }
        } catch(e) {
          console.error('[DEBUG] Could not fetch ngrok URL:', e.message);
        }
      }

      fullMediaUrl = `${protocol}://${host}${media_url}`;
    }

    console.log('[DEBUG] Original media_url:', media_url);
    console.log('[DEBUG] Full media URL sent to Meta:', fullMediaUrl);

    let metaResult;
      if (conv.channel === 'instagram') {
        if (message_type === 'text' || !message_type) {
          metaResult = await InstagramService.sendTextMessage(conv.phone, content, req.user.businessId);
        } else {
          metaResult = await InstagramService.sendMediaMessage(conv.phone, message_type, fullMediaUrl, req.user.businessId);
        }
      } else if (conv.channel === 'messenger') {
        if (message_type === 'text' || !message_type) {
          metaResult = await FacebookService.sendTextMessage(conv.phone, content, req.user.businessId);
        } else {
          metaResult = await FacebookService.sendMediaMessage(conv.phone, message_type, fullMediaUrl, req.user.businessId);
        }
      } else {
        // Default to WhatsApp
        if (message_type === 'text' || !message_type) {
          metaResult = await WhatsappService.sendTextMessage(conv.phone, content, req.user.businessId);
        } else {
          // For audio and other media types, no caption is needed for audio
          metaResult = await WhatsappService.sendMediaMessage(conv.phone, message_type, fullMediaUrl, '', req.user.businessId);
        }
      }

    if (!metaResult.success) {
      console.error('[DEBUG] WhatsApp API Error:', metaResult.message);
      return res.status(400).json({ success: false, message: metaResult.message, data: null });
    }

      const [result] = await pool.query(
        'INSERT INTO messages (conversation_id, direction, content, media_url, message_type, wa_message_id) VALUES (?, ?, ?, ?, ?, ?)',
        [convId, 'outbound', content, media_url || null, message_type || 'text', metaResult.data?.messages?.[0]?.id || metaResult.data?.message_id || null]
      );
    
    // Update conversation timestamp
    await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [convId]);

    const [msg] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(`biz_${conv.business_id}`).emit('new_message', { conversationId: convId, message: msg[0] });
    }

    // Successful response
    res.json({ success: true, data: msg[0], message: 'Message sent' });
  } catch (err) {
    console.error('[DEBUG] SendMessage error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};


const assignConversation = async (req, res) => {
  try {
    if (req.user.role === 'agent') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { agent_id } = req.body;
    await pool.query('UPDATE conversations SET assigned_to = ? WHERE id = ? AND business_id = ?', [agent_id, req.params.id, req.user.businessId]);
    if (req.app.get('io')) {
      req.app.get('io').to(`biz_${req.user.businessId}`).emit('conversation_updated', { conversationId: req.params.id, assigned_to: agent_id });
    }
    res.json({ success: true, data: null, message: 'Assigned' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let query = 'UPDATE conversations SET status = ? WHERE id = ? AND business_id = ?';
    const params = [status, req.params.id, req.user.businessId];
    if (req.user.role === 'agent') {
      query += ' AND assigned_to = ?';
      params.push(req.user.userId);
    }
    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) {
      return res.status(403).json({ success: false, message: 'Access denied or not found' });
    }
    if (req.app.get('io')) {
      req.app.get('io').to(`biz_${req.user.businessId}`).emit('conversation_updated', { conversationId: req.params.id, status });
    }
    res.json({ success: true, data: null, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createConversation = async (req, res) => {
  try {
    const { contact_id, channel } = req.body;
    const bizId = req.user.businessId;
    const [existing] = await pool.query(
      "SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND status='open'",
      [bizId, contact_id]
    );
    if (existing.length) return res.json({ success: true, data: existing[0], message: 'Existing conversation' });

    const [result] = await pool.query(
      'INSERT INTO conversations (business_id, contact_id, channel) VALUES (?, ?, ?)',
      [bizId, contact_id, channel || 'whatsapp']
    );
    const [rows] = await pool.query('SELECT * FROM conversations WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteConversation = async (req, res) => {
  try {
    const convId = req.params.id;
    const bizId = req.user.businessId;
    
    // Verify conversation belongs to this business
    let checkQuery = 'SELECT id FROM conversations WHERE id = ? AND business_id = ?';
    const params = [convId, bizId];
    if (req.user.role === 'agent') {
      checkQuery += ' AND assigned_to = ?';
      params.push(req.user.userId);
    }
    const [convRows] = await pool.query(checkQuery, params);
    if (!convRows.length) return res.status(404).json({ success: false, message: 'Conversation not found or access denied', data: null });

    // Delete messages first due to foreign key constraints
    await pool.query('DELETE FROM messages WHERE conversation_id = ?', [convId]);
    
    // Delete conversation
    await pool.query('DELETE FROM conversations WHERE id = ? AND business_id = ?', [convId, bizId]);

    if (req.app.get('io')) {
      req.app.get('io').to(`biz_${bizId}`).emit('conversation_deleted', { conversationId: convId });
    }

    res.json({ success: true, data: null, message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const sendTemplateMessage = async (req, res) => {
  try {
    const { template_name, template_language, template_id } = req.body;
    const convId = req.params.id;

    if (!template_name) {
      return res.status(400).json({ success: false, message: 'Template name is required', data: null });
    }

    // Get conversation and contact phone
    let query = 'SELECT c.*, co.phone FROM conversations c JOIN contacts co ON c.contact_id = co.id WHERE c.id = ? AND c.business_id = ?';
    const params = [convId, req.user.businessId];
    if (req.user.role === 'agent') {
      query += ' AND c.assigned_to = ?';
      params.push(req.user.userId);
    }
    const [convRows] = await pool.query(query, params);
    if (!convRows.length) return res.status(404).json({ success: false, message: 'Conversation not found', data: null });
    const conv = convRows[0];

    // Send template via WhatsApp API
    const metaResult = await WhatsappService.sendTemplateMessage(
      conv.phone,
      template_name,
      template_language || 'en',
      [],
      req.user.businessId
    );

    if (!metaResult.success) {
      return res.status(400).json({ success: false, message: metaResult.message, data: null });
    }

    // Fetch template body for display
    let displayContent = `📋 Template: ${template_name}`;
    if (template_id) {
      const [tRows] = await pool.query('SELECT body FROM templates WHERE id=?', [template_id]);
      if (tRows.length && tRows[0].body) {
        displayContent = tRows[0].body;
      }
    }

    // Save to messages table
    const waMessageId = metaResult.data?.messages?.[0]?.id || null;
    const [result] = await pool.query(
      'INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [convId, 'outbound', displayContent, 'template', waMessageId, 'sent']
    );

    // Update conversation timestamp
    await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [convId]);

    const [msg] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(`biz_${conv.business_id}`).emit('new_message', { conversationId: parseInt(convId), message: msg[0] });
      req.app.get('io').to(`biz_${conv.business_id}`).emit('conversation_updated', { conversationId: parseInt(convId) });
    }

    res.json({ success: true, data: msg[0], message: 'Template sent' });
  } catch (err) {
    console.error('[DEBUG] SendTemplateMessage error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = { getConversations, getMessages, sendMessage, sendTemplateMessage, assignConversation, updateStatus, createConversation, deleteConversation };
