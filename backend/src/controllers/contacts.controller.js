const pool = require('../db/pool');
const { parseCSV, buildCSV } = require('../utils/csvParser');
const { v4: uuidv4 } = require('crypto');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const paginate = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(10000, parseInt(limit) || 1000);
  return { offset: (p - 1) * l, limit: l, page: p };
};

const getContacts = async (req, res) => {
  try {
    const { page, limit, tags, channel, search, status, agent } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const bizId = req.user.businessId;

    let where = 'WHERE business_id = ?';
    const params = [bizId];
    if (req.user.role === 'agent') {
      where += ' AND assigned_to = ?';
      params.push(req.user.userId);
    } else if (agent) {
      where += ' AND assigned_to = ?';
      params.push(agent);
    }
    if (channel) { where += ' AND channel_preference = ?'; params.push(channel); }
    if (status) { where += ' AND status_name = ?'; params.push(status); }
    if (search) { where += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (tags) { where += ' AND JSON_CONTAINS(tags, ?)'; params.push(JSON.stringify(tags)); }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM contacts ${where}`, params);
    const [rows] = await pool.query(`
      SELECT c.*, 
        (SELECT remarks FROM follow_ups WHERE contact_id = c.id ORDER BY follow_up_id DESC LIMIT 1) as latest_remark
      FROM contacts c 
      ${where} 
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `, [...params, lim, offset]);

    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getContact = async (req, res) => {
  try {
    let q = 'SELECT * FROM contacts WHERE id = ? AND business_id = ?';
    const params = [req.params.id, req.user.businessId];
    if (req.user.role === 'agent') {
      q += ' AND assigned_to = ?';
      params.push(req.user.userId);
    }
    const [rows] = await pool.query(q, params);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const contact = rows[0];

    // Fetch custom field values with field metadata
    const [customValues] = await pool.query(
      `SELECT lf.id as field_id, lf.label, lf.field_key, lf.field_type, lf.options, lf.is_required, lf.display_order,
              ccv.value
       FROM lead_fields lf
       LEFT JOIN contact_custom_values ccv ON ccv.field_id = lf.id AND ccv.contact_id = ?
       WHERE lf.business_id = ?
       ORDER BY lf.display_order ASC, lf.id ASC`,
      [req.params.id, req.user.businessId]
    );
    contact.custom_fields = customValues.map(f => ({
      ...f,
      options: typeof f.options === 'string' ? JSON.parse(f.options || '[]') : (f.options || [])
    }));

    res.json({ success: true, data: contact, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createContact = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let { name, phone, email, tags, channel_preference, assigned_to, address, custom_field_values, status, remark, follow_up_date, enquiry_for_id, branch_id, branch_name, department_id, department_name, status_id, status_name } = req.body;
    const bizId = req.user.businessId;

    if (!assigned_to || !branch_id || !department_id) {
      const query = `
        SELECT u.branch_id, b.name as branch_name, u.department_id, d.name as department_name 
        FROM users u 
        LEFT JOIN branches b ON u.branch_id = b.id 
        LEFT JOIN departments d ON u.department_id = d.id 
        WHERE u.id = ?
      `;
      const [uRows] = await conn.query(query, [req.user.userId]);
      if (uRows.length > 0) {
        if (!assigned_to) assigned_to = req.user.userId;
        if (!branch_id) { 
          branch_id = uRows[0].branch_id; 
          branch_name = uRows[0].branch_name; 
        }
        if (!department_id) { 
          department_id = uRows[0].department_id; 
          department_name = uRows[0].department_name; 
        }
      }
    }

    let assignTo = assigned_to || null;
    if (req.user.role === 'agent') {
      assignTo = req.user.userId;
    }
    let userList = assignTo ? [assignTo] : [];
    
    let formattedFollowUpDate = null;
    if (follow_up_date) {
      formattedFollowUpDate = new Date(follow_up_date).toISOString().split('T')[0];
    }

    const [result] = await conn.query(
      'INSERT INTO contacts (business_id, name, phone, email, tags, channel_preference, assigned_to, address, follow_up_date, enquiry_for_id, branch_id, branch_name, department_id, department_name, status_id, status_name, created_by_user, follow_up, user_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [bizId, name, phone, email || null, JSON.stringify(tags || []), channel_preference || 'whatsapp', assignTo, address || null, formattedFollowUpDate, enquiry_for_id || null, branch_id || null, branch_name || null, department_id || null, department_name || null, status_id || null, status_name || null, req.user.userId, formattedFollowUpDate ? 1 : 0, JSON.stringify(userList)]
    );
    const contactId = result.insertId;

    // Fetch by_user_name and to_user_name
    let byUserName = null;
    let toUserName = null;
    if (req.user.userId) {
      const [u] = await conn.query('SELECT name FROM users WHERE id = ?', [req.user.userId]);
      if (u.length) byUserName = u[0].name;
    }
    if (assignTo) {
      const [tu] = await conn.query('SELECT name FROM users WHERE id = ?', [assignTo]);
      if (tu.length) toUserName = tu[0].name;
    }

    // Save initial follow up
    await conn.query(
      'INSERT INTO follow_ups (contact_id, contact_name, follow_up_date, by_user_id, by_user_name, to_user_id, to_user_name, status_id, status_name, branch_id, branch_name, department_id, department_name, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [contactId, name, formattedFollowUpDate, req.user.userId, byUserName, assignTo, toUserName, status_id || null, status_name || null, branch_id || null, branch_name || null, department_id || null, department_name || null, remark || 'Contact created']
    );

    // Save custom field values
    if (custom_field_values && typeof custom_field_values === 'object') {
      for (const [fieldId, value] of Object.entries(custom_field_values)) {
        if (value !== undefined && value !== null && value !== '') {
          await conn.query(
            'INSERT INTO contact_custom_values (contact_id, business_id, field_id, value) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)',
            [contactId, bizId, fieldId, String(value)]
          );
        }
      }
    }

    await conn.commit();

    const [rows] = await pool.query('SELECT * FROM contacts WHERE id = ?', [contactId]);
    
    if (assignTo) {
      const io = req.app.get('io');
      if (io) {
        io.to(`biz_${bizId}`).emit('contact_assigned', { contact: rows[0], assigned_to: assignTo });
      }
    }

    res.status(201).json({ success: true, data: rows[0], message: 'Contact created' });
  } catch (err) {
    if (conn) await conn.rollback();
    console.log('error from contacts',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  } finally {
    if (conn) conn.release();
  }
};

const updateContact = async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const bizId = req.user.businessId;
    const contactId = req.params.id;
    const userId = req.user.userId;
    const { custom_field_values, ...updateFields } = req.body;

    const [existingRows] = await conn.query('SELECT * FROM contacts WHERE id = ? AND business_id = ?', [contactId, bizId]);
    if (!existingRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Not found', data: null });
    }
    const oldContact = existingRows[0];

    // Format follow_up_date if provided
    if (updateFields.follow_up_date) {
      updateFields.follow_up_date = new Date(updateFields.follow_up_date).toISOString().split('T')[0];
    }

    // Step 1: Log to follow_ups BEFORE updating contacts
    if (updateFields.remarks !== undefined || updateFields.status_id !== undefined || updateFields.assigned_to !== undefined) {
      let byUserName = null;
      let toUserName = null;
      const toUserId = updateFields.assigned_to !== undefined ? (updateFields.assigned_to || null) : oldContact.assigned_to;
      if (userId) {
        const [u] = await conn.query('SELECT name FROM users WHERE id = ?', [userId]);
        if (u.length) byUserName = u[0].name;
      }
      if (toUserId) {
        const [tu] = await conn.query('SELECT name FROM users WHERE id = ?', [toUserId]);
        if (tu.length) toUserName = tu[0].name;
      }

      await conn.query(
        'INSERT INTO follow_ups (contact_id, contact_name, follow_up_date, by_user_id, by_user_name, to_user_id, to_user_name, status_id, status_name, branch_id, branch_name, department_id, department_name, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          contactId, 
          oldContact.name, 
          updateFields.follow_up_date !== undefined ? updateFields.follow_up_date : oldContact.follow_up_date, 
          userId, 
          byUserName,
          toUserId, 
          toUserName,
          updateFields.status_id !== undefined ? updateFields.status_id : oldContact.status_id, 
          updateFields.status_name !== undefined ? updateFields.status_name : oldContact.status_name, 
          updateFields.branch_id !== undefined ? updateFields.branch_id : oldContact.branch_id, 
          updateFields.branch_name !== undefined ? updateFields.branch_name : oldContact.branch_name, 
          updateFields.department_id !== undefined ? updateFields.department_id : oldContact.department_id, 
          updateFields.department_name !== undefined ? updateFields.department_name : oldContact.department_name, 
          updateFields.remarks !== undefined ? updateFields.remarks : (updateFields.remark || '')
        ]
      );
    }

    // Step 2: UPDATE contacts
    let updates = [];
    let params = [];

    const allowedFields = ['name', 'phone', 'email', 'tags', 'channel_preference', 'address', 'follow_up_date', 'enquiry_for_id', 'branch_id', 'branch_name', 'department_id', 'department_name', 'status_id', 'status_name', 'sale_won', 'sale_lost'];
    
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        updates.push(`${key} = ?`);
        params.push(key === 'tags' ? JSON.stringify(updateFields[key] || []) : (updateFields[key] || null));
      }
    }

    if (req.user.role !== 'agent' && updateFields.assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(updateFields.assigned_to || null);

      if (updateFields.assigned_to) {
        let currentList = oldContact.user_list ? (typeof oldContact.user_list === 'string' ? JSON.parse(oldContact.user_list) : oldContact.user_list) : [];
        currentList.push(updateFields.assigned_to);
        updates.push('user_list = ?');
        params.push(JSON.stringify(currentList));
      }
    }

    if (updateFields.follow_up_date !== undefined) {
      updates.push('follow_up = ?');
      params.push(updateFields.follow_up_date ? 1 : 0);
    }

    if (updates.length > 0) {
      if (updateFields.remarks !== undefined || updateFields.status_id !== undefined || updateFields.assigned_to !== undefined) {
          updates.push('follow_up_count = follow_up_count + 1');
      }

      let query = `UPDATE contacts SET ${updates.join(', ')} WHERE id = ? AND business_id = ?`;
      params.push(contactId, bizId);
      if (req.user.role === 'agent') {
        query += ' AND assigned_to = ?';
        params.push(userId);
      }
      await conn.query(query, params);
    }

    const formatValue = (val) => {
      if (val instanceof Date) return val.toISOString().split('T')[0];
      return val ? String(val) : null;
    };
    const logHistory = async (field, oldVal, newVal) => {
      const formattedOld = formatValue(oldVal);
      const formattedNew = formatValue(newVal);
      if (formattedOld !== formattedNew) {
        await conn.query(
          'INSERT INTO contact_history (contact_id, business_id, user_id, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
          [contactId, bizId, userId, field, formattedOld, formattedNew]
        );
      }
    };

    if (updateFields.status !== undefined) await logHistory('status', oldContact.status, updateFields.status);
    if (updateFields.remark !== undefined) await logHistory('remark', oldContact.remark, updateFields.remark);
    if (updateFields.follow_up_date !== undefined) await logHistory('follow_up_date', oldContact.follow_up_date, updateFields.follow_up_date);

    if (custom_field_values && typeof custom_field_values === 'object') {
      for (const [fieldId, value] of Object.entries(custom_field_values)) {
        if (value !== undefined && value !== null && value !== '') {
          await conn.query(
            'INSERT INTO contact_custom_values (contact_id, business_id, field_id, value) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)',
            [contactId, bizId, fieldId, String(value)]
          );
        } else {
          await conn.query('DELETE FROM contact_custom_values WHERE contact_id=? AND field_id=?', [contactId, fieldId]);
        }
      }
    }

    await conn.commit();

    const [rows] = await pool.query('SELECT * FROM contacts WHERE id = ?', [contactId]);
    if (req.user.role !== 'agent' && updateFields.assigned_to !== undefined) {
      const io = req.app.get('io');
      if (io) io.to(`biz_${bizId}`).emit('contact_assigned', { contact: rows[0], assigned_to: updateFields.assigned_to });
    }

    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, message: err.message, data: null });
  } finally {
    if (conn) conn.release();
  }
};

const deleteContact = async (req, res) => {
  try {
    const contactId = req.params.id;
    const bizId = req.user.businessId;

    let checkQuery = 'SELECT id FROM contacts WHERE id = ? AND business_id = ?';
    const params = [contactId, bizId];
    if (req.user.role === 'agent') {
      checkQuery += ' AND assigned_to = ?';
      params.push(req.user.userId);
    }
    const [check] = await pool.query(checkQuery, params);
    if (!check.length) {
      return res.status(404).json({ success: false, message: 'Not found or access denied', data: null });
    }

    // Find and delete associated conversations and messages to satisfy foreign key constraints
    const [convos] = await pool.query('SELECT id FROM conversations WHERE contact_id = ?', [contactId]);
    if (convos.length > 0) {
      const convoIds = convos.map(c => c.id);
      await pool.query('DELETE FROM messages WHERE conversation_id IN (?)', [convoIds]);
      await pool.query('DELETE FROM conversations WHERE contact_id = ?', [contactId]);
    }

    await pool.query('DELETE FROM contacts WHERE id = ?', [contactId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const importContacts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded', data: null });
    const rows = await parseCSV(req.file.path);
    const bizId = req.user.businessId;
    let imported = 0;
    for (const row of rows) {
      const name = row.name || row.Name || '';
      const phone = row.phone || row.Phone || '';
      const email = row.email || row.Email || '';
      const tags = row.tags ? JSON.stringify(row.tags.split('|').map(t => t.trim())) : '[]';
      if (!phone) continue;
      await pool.query(
        'INSERT INTO contacts (business_id, name, phone, email, tags, opt_in_source) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
        [bizId, name, phone, email, tags, 'import']
      );
      imported++;
    }
    fs.unlinkSync(req.file.path);
    res.json({ success: true, data: { imported }, message: `${imported} contacts imported` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const exportContacts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name, phone, email, opted_in, channel_preference, created_at FROM contacts WHERE business_id = ?', [req.user.businessId]);
    const csv = buildCSV(rows, ['name', 'phone', 'email', 'opted_in', 'channel_preference', 'created_at']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const optIn = async (req, res) => {
  try {
    const { source } = req.body;
    await pool.query(
      'UPDATE contacts SET opted_in=1, opt_in_date=NOW(), opt_in_source=? WHERE id=? AND business_id=?',
      [source || 'manual', req.params.id, req.user.businessId]
    );
    res.json({ success: true, data: null, message: 'Opted in' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const optOut = async (req, res) => {
  try {
    await pool.query(
      'UPDATE contacts SET opted_in=0, opt_out_date=NOW() WHERE id=? AND business_id=?',
      [req.params.id, req.user.businessId]
    );
    res.json({ success: true, data: null, message: 'Opted out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createOptInLink = async (req, res) => {
  try {
    const { redirectUrl } = req.body;
    const token = crypto.randomBytes(16).toString('hex');
    await pool.query(
      'INSERT INTO opt_in_links (business_id, token, redirect_url) VALUES (?, ?, ?)',
      [req.user.businessId, token, redirectUrl || '']
    );
    const link = `${process.env.BASE_URL}/optin/${token}`;
    res.json({ success: true, data: { token, link }, message: 'Opt-in link created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const handleOptInLink = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM opt_in_links WHERE token = ?', [req.params.token]);
    if (!rows.length) return res.status(404).send('Invalid link');
    const link = rows[0];
    const phone = req.query.phone;
    if (phone) {
      const [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [link.business_id, phone]);
      if (contacts.length) {
        await pool.query('UPDATE contacts SET opted_in=1, opt_in_date=NOW(), opt_in_source=? WHERE id=?', ['link', contacts[0].id]);
      } else {
        await pool.query('INSERT INTO contacts (business_id, phone, opted_in, opt_in_date, opt_in_source) VALUES (?, ?, 1, NOW(), ?)', [link.business_id, phone, 'link']);
      }
    }
    if (link.redirect_url) return res.redirect(link.redirect_url);
    res.send('<html><body><h2>✅ You have successfully opted in!</h2></body></html>');
  } catch (err) {
    res.status(500).send('Error processing opt-in');
  }
};

const getUniqueTags = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    console.log(`[DEBUG] Fetching unique tags for Biz ID: ${bizId}`);
    const [rows] = await pool.query('SELECT tags FROM contacts WHERE business_id = ? AND opted_in = 1', [bizId]);
    console.log(`[DEBUG] Found ${rows.length} contacts with tags`);
    const tags = new Set();
    rows.forEach(r => {
      let ct = r.tags;
      if (typeof ct === 'string') {
        try { ct = JSON.parse(ct); } catch (e) { ct = []; }
      }
      if (Array.isArray(ct)) {
        ct.forEach(t => tags.add(t));
      }
    });
    console.log(`[DEBUG] Unique tags found: ${Array.from(tags).join(', ')}`);
    res.json({ success: true, data: Array.from(tags), message: 'OK' });
  } catch (err) {
    console.error(`[DEBUG] getUniqueTags Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getContactHistory = async (req, res) => {
  try {
    const contactId = req.params.id;
    const bizId = req.user.businessId;
    
    // Ensure user has access to contact
    let q = 'SELECT id FROM contacts WHERE id = ? AND business_id = ?';
    const params = [contactId, bizId];
    if (req.user.role === 'agent') {
      q += ' AND assigned_to = ?';
      params.push(req.user.userId);
    }
    const [contacts] = await pool.query(q, params);
    console.log('[DEBUG] getContactHistory -> contactId:', contactId, 'bizId:', bizId, 'role:', req.user.role, 'userId:', req.user.userId, 'contacts:', contacts);
    if (!contacts.length) return res.status(404).json({ success: false, message: 'Contact not found or access denied', data: null });

    const [history] = await pool.query(`
      SELECT ch.*, u.name as changed_by_name 
      FROM contact_history ch 
      LEFT JOIN users u ON ch.user_id = u.id 
      WHERE ch.contact_id = ? AND ch.business_id = ? 
      ORDER BY ch.created_at DESC
    `, [contactId, bizId]);

    res.json({ success: true, data: history, message: 'History fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getContactDocuments = async (req, res) => {
  try {
    const contactId = req.params.id;
    const bizId = req.user.businessId;
    
    const [rows] = await pool.query(
      'SELECT * FROM user_document_upload WHERE contact_id = ? AND business_id = ? ORDER BY created_at DESC',
      [contactId, bizId]
    );
    
    res.json({ success: true, data: rows, message: 'Documents fetched' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const uploadContactDocument = async (req, res) => {
  try {
    const contactId = req.params.id;
    const bizId = req.user.businessId;
    const { documentType, notes } = req.body;
    
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded', data: null });
    
    let folder = 'media';
    if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) folder = 'csv';
    const fileUrl = `/uploads/${folder}/${req.file.filename}`;
    let fileSizeStr = '';
    if (req.file.size < 1024 * 1024) {
      fileSizeStr = (req.file.size / 1024).toFixed(1) + ' KB';
    } else {
      fileSizeStr = (req.file.size / 1024 / 1024).toFixed(1) + ' MB';
    }

    // Determine extension/type visually for the frontend
    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let typeIcon = 'file';
    if (['pdf'].includes(ext)) typeIcon = 'pdf';
    else if (['doc', 'docx'].includes(ext)) typeIcon = 'doc';
    else if (['zip', 'rar'].includes(ext)) typeIcon = 'zip';

    const [result] = await pool.query(
      `INSERT INTO user_document_upload 
       (contact_id, business_id, document_type, file_name, file_url, file_size, notes, uploaded_by, file_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contactId, bizId, documentType || 'Other', req.file.originalname, fileUrl, fileSizeStr, notes || '', req.user.userId || null, typeIcon]
    );

    const [docs] = await pool.query('SELECT * FROM user_document_upload WHERE id = ?', [result.insertId]);

    res.json({ success: true, data: docs[0], message: 'Document uploaded' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = { getContacts, getContact, createContact, updateContact, deleteContact, importContacts, exportContacts, optIn, optOut, createOptInLink, handleOptInLink, getUniqueTags, getContactHistory, getContactDocuments, uploadContactDocument };
