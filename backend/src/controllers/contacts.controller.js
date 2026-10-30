const pool = require('../db/pool');
const { getAccessibleUserIds, buildUserScopeFilter } = require('../services/teamHierarchy.service');

// Strip garbled encoding artifacts (e.g. em-dash stored in latin1 column comes back as Î“Ã‡Ã¶)
// Heuristic: if >50% of chars are non-ASCII and string is â‰¤10 chars â†’ treat as garbage
const sanitizeRemark = (text) => {
  if (!text) return null;
  const t = text.trim();
  if (!t) return null;
  const nonAscii = (t.match(/[^\x00-\x7F]/g) || []).length;
  if (nonAscii > 0 && (nonAscii / t.length) > 0.5 && t.length <= 10) return null;
  return t;
};

const { parseFile, buildCSV } = require('../utils/csvParser');
const { v4: uuidv4 } = require('crypto');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const r2Service = require('../services/r2.service');

const paginate = (page, limit) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(10000, parseInt(limit) || 1000);
  return { offset: (p - 1) * l, limit: l, page: p };
};

const getContacts = async (req, res) => {
  try {
    const { page, limit, tags, channel, search, status, agent, has_followup, has_applications, app_status, receipt_type, enquiry_for } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const bizId = req.user.businessId;

    let where = 'WHERE c.business_id = ?';
    const params = [bizId];

    if (has_applications === '1' || has_applications === 'true') {
      where += ' AND EXISTS (SELECT 1 FROM applications a WHERE a.contact_id = c.id)';
    }

    if (app_status) {
      where += ` AND EXISTS (
        SELECT 1 FROM applications a 
        LEFT JOIN application_statuses s ON a.status_id = s.id 
        WHERE a.contact_id = c.id 
          AND (LOWER(TRIM(COALESCE(s.name, ''))) LIKE LOWER(CONCAT('%', ?, '%')) OR a.status_id = ?)
      )`;
      params.push(app_status.trim(), app_status.trim());
    }

    if (receipt_type) {
      where += ` AND EXISTS (
        SELECT 1 FROM receipts r
        LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
        WHERE r.contact_id = c.id
          AND (
            LOWER(TRIM(COALESCE(r.receipt_type_name, ''))) LIKE LOWER(CONCAT('%', ?, '%'))
            OR LOWER(TRIM(COALESCE(rt.name, ''))) LIKE LOWER(CONCAT('%', ?, '%'))
          )
      )`;
      params.push(receipt_type.trim(), receipt_type.trim());
    }

    const accessibleUserIds = await getAccessibleUserIds(req.user, bizId);
    if (accessibleUserIds !== null) {
      if (accessibleUserIds.length === 0) {
        where += ' AND 1 = 0 ';
      } else if (req.query.transferred_only === 'true') {
        const selfId = Number(req.user.userId);
        where += ` AND (JSON_CONTAINS(c.user_list, JSON_QUOTE(?)) OR JSON_CONTAINS(c.user_list, ?)) AND (c.assigned_to != ? OR c.assigned_to IS NULL)`;
        params.push(selfId.toString(), selfId.toString(), selfId);
      } else if (agent) {
        const reqAgentId = Number(agent);
        if (accessibleUserIds.includes(reqAgentId)) {
          where += ' AND c.assigned_to = ? ';
          params.push(reqAgentId);
        } else {
          where += ' AND 1 = 0 ';
        }
      } else {
        where += ` AND c.assigned_to IN (${accessibleUserIds.map(() => '?').join(',')})`;
        params.push(...accessibleUserIds);
      }
    } else {
      if (req.query.transferred_only === 'true') {
        if (agent) {
          where += ` AND (JSON_CONTAINS(c.user_list, JSON_QUOTE(?)) OR JSON_CONTAINS(c.user_list, ?)) AND (c.assigned_to != ? OR c.assigned_to IS NULL)`;
          params.push(agent.toString(), agent, agent);
        } else {
          where += ` AND JSON_LENGTH(c.user_list) > 1`;
        }
      } else if (agent) {
        where += ' AND c.assigned_to = ?';
        params.push(agent);
      }
    }
    if (channel) { where += ' AND c.channel_preference = ?'; params.push(channel); }
    if (has_followup === '1' || has_followup === 'true') {
      where += ' AND c.follow_up_date IS NOT NULL';
    }
    if (status === 'No Follow Up' || status === 'no_followup' || (status && status.trim() === 'NO DATE')) {
      where += ' AND c.follow_up_date IS NULL';
    } else if (status) {
      where += ' AND c.status_name = ?';
      params.push(status);
    }
    if (search) { where += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (tags) { where += ' AND JSON_CONTAINS(c.tags, ?)'; params.push(JSON.stringify(tags)); }
    if (enquiry_for) {
      where += ` AND (c.enquiry_for_id = ? OR EXISTS (SELECT 1 FROM enquiry_fors ef WHERE ef.id = c.enquiry_for_id AND LOWER(TRIM(ef.name)) = LOWER(TRIM(?))))`;
      params.push(enquiry_for, enquiry_for);
    }

    const [[{ total, with_followup, without_followup }]] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN c.follow_up_date IS NOT NULL THEN 1 END) as with_followup,
        COUNT(CASE WHEN c.follow_up_date IS NULL THEN 1 END) as without_followup
      FROM contacts c ${where}
    `, params);
    const [rows] = await pool.query(`
      SELECT c.*, u.name as assigned_employee_name,
        e.name as enquiry_for_name,
        (SELECT remarks FROM follow_ups WHERE contact_id = c.id ORDER BY follow_up_id DESC LIMIT 1) as latest_remark
      FROM contacts c 
      LEFT JOIN users u ON c.assigned_to = u.id
      LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id
      ${where} 
      ORDER BY c.created_at DESC, c.id DESC 
      LIMIT ? OFFSET ?
    `, [...params, lim, offset]);

    let baseWhere = 'WHERE c.business_id = ?';
    const baseParams = [bizId];
    if (accessibleUserIds !== null) {
      if (accessibleUserIds.length === 0) {
        baseWhere += ' AND 1 = 0 ';
      } else {
        baseWhere += ` AND c.assigned_to IN (${accessibleUserIds.map(() => '?').join(',')})`;
        baseParams.push(...accessibleUserIds);
      }
    }
    const [[{ overall_total }]] = await pool.query(
      `SELECT COUNT(*) as overall_total FROM contacts c ${baseWhere}`,
      baseParams
    );

    res.json({ success: true, data: rows.map(r => ({ ...r, latest_remark: sanitizeRemark(r.latest_remark) })), total, overall_total: overall_total || total, with_followup, without_followup, page: p, limit: lim, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getContact = async (req, res) => {
  try {
    let q = `
      SELECT c.*,
             COALESCE(u.name, 'Unassigned') as assigned_employee_name,
             (SELECT remarks FROM follow_ups WHERE contact_id = c.id ORDER BY follow_up_id DESC LIMIT 1) as latest_remark,
             (SELECT follow_up_date FROM follow_ups WHERE contact_id = c.id ORDER BY follow_up_id DESC LIMIT 1) as latest_follow_up_date
      FROM contacts c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.id = ? AND c.business_id = ?
    `;
    const params = [req.params.id, req.user.businessId];
    const accessibleUserIds = await getAccessibleUserIds(req.user, req.user.businessId);
    if (accessibleUserIds !== null) {
      if (accessibleUserIds.length === 0) {
        q += ' AND 1 = 0 ';
      } else {
        q += ` AND (c.assigned_to IN (${accessibleUserIds.map(() => '?').join(',')}) OR c.created_by_user IN (${accessibleUserIds.map(() => '?').join(',')}))`;
        params.push(...accessibleUserIds, ...accessibleUserIds);
      }
    }
    const [rows] = await pool.query(q, params);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const contact = rows[0];

    const fDate = contact.follow_up_date || contact.latest_follow_up_date;
    if (fDate) {
      try {
        const d = new Date(fDate);
        const now = new Date();
        d.setHours(0,0,0,0);
        now.setHours(0,0,0,0);
        if (d.getTime() < now.getTime()) contact.followup_status = 'Overdue';
        else if (d.getTime() === now.getTime()) contact.followup_status = 'Due Today';
        else contact.followup_status = 'Upcoming';
      } catch(e) {}
    }

    // Fetch allowed categories for the user
    let allowedCategories = null;
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      const [uRows] = await pool.query('SELECT allowed_custom_field_categories FROM users WHERE id = ?', [req.user.userId]);
      if (uRows.length && uRows[0].allowed_custom_field_categories) {
        allowedCategories = typeof uRows[0].allowed_custom_field_categories === 'string' 
          ? JSON.parse(uRows[0].allowed_custom_field_categories) 
          : uRows[0].allowed_custom_field_categories;
      }
    }

    // Fetch custom field values with field metadata
    const [customValues] = await pool.query(
      `SELECT lf.id as field_id, lf.category_id, lf.label, lf.field_key, lf.field_type, lf.options, lf.is_required, lf.display_order,
              ccv.value
       FROM lead_fields lf
       LEFT JOIN contact_custom_values ccv ON ccv.field_id = lf.id AND ccv.contact_id = ?
       WHERE lf.business_id = ?
       ORDER BY lf.display_order ASC, lf.id ASC`,
      [req.params.id, req.user.businessId]
    );

    let mappedValues = customValues.map(f => ({
      ...f,
      options: typeof f.options === 'string' ? JSON.parse(f.options || '[]') : (f.options || [])
    }));

    if (allowedCategories !== null && Array.isArray(allowedCategories)) {
      const allowedCategoriesStr = allowedCategories.map(c => String(c));
      mappedValues = mappedValues.filter(f => allowedCategoriesStr.includes(String(f.category_id)) || f.category_id === null);
    }

    contact.custom_fields = mappedValues;

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

    if (phone) {
      const numericPhone = phone.replace(/\D/g, '');
      if (numericPhone.length !== 12) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ success: false, message: 'Phone number must be exactly 12 digits.', data: null });
      }
      phone = numericPhone; // Save the validated numeric phone

      // Check for duplicate by last 10 digits
      const last10 = phone.slice(-10);
      const dupQuery = `
        SELECT c.id, u.name as agent_name 
        FROM contacts c 
        LEFT JOIN users u ON c.assigned_to = u.id 
        WHERE c.business_id = ? AND c.phone LIKE ? LIMIT 1
      `;
      const [dupRows] = await conn.query(dupQuery, [bizId, `%${last10}`]);
      if (dupRows.length > 0) {
        await conn.rollback();
        conn.release();
        const agentName = dupRows[0].agent_name || 'Unassigned';
        return res.status(409).json({ 
          success: false, 
          message: `The contact already exists. Assigned to: ${agentName}`, 
          data: null 
        });
      }
    }

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

    let current_sale_status = 0;
    let sale_won = 0, sale_lost = 0;
    let sale_won_date = null, sale_lost_date = null;
    let sale_won_by = null, sale_lost_by = null;

    if (status_id) {
      const [statusRows] = await conn.query('SELECT type FROM statuses WHERE id = ?', [status_id]);
      if (statusRows.length > 0) {
        if (statusRows[0].type === 'sale') {
          current_sale_status = 1;
          sale_won = 1;
          sale_won_date = new Date();
          sale_won_by = assignTo;
        }
        else if (statusRows[0].type === 'sale_lost') {
          current_sale_status = 2;
          sale_lost = 1;
          sale_lost_date = new Date();
          sale_lost_by = assignTo;
        }
      }
    }

    const [result] = await conn.query(
      'INSERT INTO contacts (business_id, name, phone, email, tags, channel_preference, assigned_to, address, follow_up_date, enquiry_for_id, branch_id, branch_name, department_id, department_name, status_id, status_name, current_sale_status, sale_won, sale_won_date, sale_won_by, sale_lost, sale_lost_date, sale_lost_by, created_by_user, follow_up, user_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [bizId, name, phone, email || null, JSON.stringify(tags || []), channel_preference || 'whatsapp', assignTo, address || null, formattedFollowUpDate, enquiry_for_id || null, branch_id || null, branch_name || null, department_id || null, department_name || null, status_id || null, status_name || null, current_sale_status, sale_won, sale_won_date, sale_won_by, sale_lost, sale_lost_date, sale_lost_by, req.user.userId, formattedFollowUpDate ? 1 : 0, JSON.stringify(userList)]
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
      await pool.query(
        `INSERT INTO notifications (business_id, user_id, type, title, message, reference_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bizId, assignTo, 'assignment', 'New Contact Assigned', `You have been assigned a new contact: ${rows[0].name || rows[0].phone || 'Unknown'}`, contactId]
      );
      if (io) {
        io.to(`biz_${bizId}`).emit('contact_assigned', { contact: rows[0], assigned_to: assignTo });
        io.emit('contact_assigned', { contact: rows[0], assigned_to: assignTo });
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

    // Phone validation and duplicate check
    if (updateFields.phone) {
      const numericPhone = updateFields.phone.replace(/\D/g, '');
      if (numericPhone.length !== 12) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ success: false, message: 'Phone number must be exactly 12 digits.', data: null });
      }
      updateFields.phone = numericPhone;

      const last10 = updateFields.phone.slice(-10);
      const dupQuery = `
        SELECT c.id, u.name as agent_name 
        FROM contacts c 
        LEFT JOIN users u ON c.assigned_to = u.id 
        WHERE c.business_id = ? AND c.phone LIKE ? AND c.id != ? LIMIT 1
      `;
      const [dupRows] = await conn.query(dupQuery, [bizId, `%${last10}`, contactId]);
      if (dupRows.length > 0) {
        await conn.rollback();
        conn.release();
        const agentName = dupRows[0].agent_name || 'Unassigned';
        return res.status(409).json({ 
          success: false, 
          message: `The contact already exists. Assigned to: ${agentName}`, 
          data: null 
        });
      }
    }
    // Format follow_up_date if provided; convert empty string to null
    if (updateFields.follow_up_date !== undefined) {
      if (updateFields.follow_up_date && updateFields.follow_up_date !== '') {
        updateFields.follow_up_date = new Date(updateFields.follow_up_date).toISOString().split('T')[0];
      } else {
        updateFields.follow_up_date = null;
      }
    }

    // Step 1: Log to follow_ups BEFORE updating contacts
    if (updateFields.remarks !== undefined || updateFields.remark !== undefined || updateFields.status_id !== undefined || updateFields.status_name !== undefined || updateFields.assigned_to !== undefined) {
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
          (updateFields.follow_up_date !== undefined ? updateFields.follow_up_date : oldContact.follow_up_date) || null, 
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

    if (updateFields.status_id !== undefined) {
      let saleStatus = 0;
      if (updateFields.status_id) {
        const [statusRows] = await conn.query('SELECT type FROM statuses WHERE id = ?', [updateFields.status_id]);
        if (statusRows.length > 0) {
          if (statusRows[0].type === 'sale') saleStatus = 1;
          else if (statusRows[0].type === 'sale_lost') saleStatus = 2;
        }
      }
      updates.push('current_sale_status = ?');
      params.push(saleStatus);

      let finalAssignedTo = updateFields.assigned_to !== undefined ? updateFields.assigned_to : oldContact.assigned_to;
      if (saleStatus === 1) {
        updates.push('sale_won = 1, sale_won_date = ?, sale_won_by = ?');
        params.push(new Date(), finalAssignedTo);
      } else if (saleStatus === 2) {
        updates.push('sale_lost = 1, sale_lost_date = ?, sale_lost_by = ?');
        params.push(new Date(), finalAssignedTo);
      }
    }

    if (updateFields.assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(updateFields.assigned_to || null);

      if (updateFields.assigned_to) {
        let currentList = oldContact.user_list ? (typeof oldContact.user_list === 'string' ? JSON.parse(oldContact.user_list) : oldContact.user_list) : [];
        if (oldContact.assigned_to && !currentList.includes(oldContact.assigned_to) && !currentList.includes(String(oldContact.assigned_to)) && !currentList.includes(Number(oldContact.assigned_to))) {
          currentList.push(oldContact.assigned_to);
        }
        if (!currentList.includes(updateFields.assigned_to) && !currentList.includes(String(updateFields.assigned_to)) && !currentList.includes(Number(updateFields.assigned_to))) {
          currentList.push(updateFields.assigned_to);
        }
        updates.push('user_list = ?');
        params.push(JSON.stringify(currentList));
      }
    }

    if (updateFields.follow_up_date !== undefined) {
      updates.push('follow_up = ?');
      params.push(updateFields.follow_up_date ? 1 : 0);
    }

    if (updates.length > 0) {
      if (updateFields.remarks !== undefined || updateFields.remark !== undefined || updateFields.status_id !== undefined || updateFields.status_name !== undefined || updateFields.assigned_to !== undefined) {
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
    if (updateFields.assigned_to !== undefined && updateFields.assigned_to !== null) {
      const io = req.app.get('io');
      await pool.query(
        `INSERT INTO notifications (business_id, user_id, type, title, message, reference_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [bizId, updateFields.assigned_to, 'assignment', 'Contact Reassigned', `A contact has been assigned to you: ${rows[0].name || rows[0].phone || 'Unknown'}`, contactId]
      );
      if (io) {
        io.to(`biz_${bizId}`).emit('contact_assigned', { contact: rows[0], assigned_to: updateFields.assigned_to });
        io.emit('contact_assigned', { contact: rows[0], assigned_to: updateFields.assigned_to });
      }
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
  let conn;
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

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Helper to safely execute delete on related tables (ignores table if it doesn't exist)
    const safeDelete = async (query, args = [contactId]) => {
      try {
        await conn.query(query, args);
      } catch (e) {
        // Table might not exist or ignore minor non-fatal errors
      }
    };

    // 1. Delete associated conversations & messages
    const [convos] = await conn.query('SELECT id FROM conversations WHERE contact_id = ?', [contactId]);
    if (convos.length > 0) {
      const convoIds = convos.map(c => c.id);
      await conn.query('DELETE FROM messages WHERE conversation_id IN (?)', [convoIds]);
      await conn.query('DELETE FROM conversations WHERE contact_id = ?', [contactId]);
    }

    // 2. Delete all related foreign key rows
    await safeDelete('DELETE FROM chatbot_sessions WHERE contact_id = ?');
    await safeDelete('DELETE FROM follow_ups WHERE contact_id = ?');
    await safeDelete('DELETE FROM contact_history WHERE contact_id = ?');
    await safeDelete('DELETE FROM contact_custom_values WHERE contact_id = ?');
    await safeDelete('DELETE FROM applications WHERE contact_id = ?');
    await safeDelete('DELETE FROM leads WHERE contact_id = ?');
    await safeDelete('DELETE FROM contact_documents WHERE contact_id = ?');
    await safeDelete('DELETE FROM drip_enrollments WHERE contact_id = ?');
    await safeDelete('DELETE FROM broadcast_logs WHERE contact_id = ?');
    await safeDelete('DELETE FROM orders WHERE contact_id = ?');

    // 3. Delete contact row
    await conn.query('DELETE FROM contacts WHERE id = ?', [contactId]);

    await conn.commit();
    res.json({ success: true, data: null, message: 'Deleted successfully' });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, message: err.message, data: null });
  } finally {
    if (conn) conn.release();
  }
};

const importContacts = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded', data: null });
    const rows = await parseFile(req.file.path);
    const bizId = req.user.businessId;
    let imported = 0;
    
    // Parse assignments if provided
    let assignments = [];
    if (req.body.assignments) {
      try {
        assignments = JSON.parse(req.body.assignments);
      } catch (e) {
        console.error('Failed to parse assignments:', e);
      }
    }
    
    // Global Settings
    const globalBranchId = req.body.branch_id || null;
    const globalDepartmentId = req.body.department_id || null;
    const globalStatusId = req.body.status_id || null;
    const globalEnquirySourceId = req.body.enquiry_source_id || null;
    
    let globalBranchName = null;
    let globalDepartmentName = null;
    
    if (globalBranchId) {
      const [b] = await conn.query('SELECT name FROM branches WHERE id = ?', [globalBranchId]);
      if (b.length) globalBranchName = b[0].name;
    }
    if (globalDepartmentId) {
      const [d] = await conn.query('SELECT name FROM departments WHERE id = ?', [globalDepartmentId]);
      if (d.length) globalDepartmentName = d[0].name;
    }

    // Get uploader's info as fallback
    const [uploaderRows] = await conn.query(
      `SELECT u.branch_id, b.name as branch_name, u.department_id, d.name as department_name 
       FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [req.user.userId]
    );
    const uploaderInfo = uploaderRows[0] || {};
    
    // Get info for all assigned users to avoid querying in the loop
    const userDetailsMap = {};
    if (assignments && assignments.length > 0) {
      const userIds = assignments.map(a => a.userId);
      const [uRows] = await conn.query(
        `SELECT u.id, u.branch_id, b.name as branch_name, u.department_id, d.name as department_name 
         FROM users u 
         LEFT JOIN branches b ON u.branch_id = b.id 
         LEFT JOIN departments d ON u.department_id = d.id 
         WHERE u.id IN (?)`,
        [userIds]
      );
      for (const r of uRows) {
        userDetailsMap[r.id] = r;
      }
    }
    
    await conn.beginTransaction();

    let currentUserAssignmentIndex = 0;
    let currentUserCount = 0;

    for (const row of rows) {
      // Normalize keys by converting to lowercase
      const normalizedRow = {};
      for (let key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          normalizedRow[key.toLowerCase().trim()] = row[key];
        }
      }
      
      const name = normalizedRow.name || '';
      const phone = normalizedRow.phone || normalizedRow.contact || '';
      const email = normalizedRow.email || '';
      const rawTags = normalizedRow.tags || '';
      const tags = rawTags ? JSON.stringify(rawTags.split('|').map(t => t.trim())) : '[]';
      const address = normalizedRow.address || null;
      
      if (!phone) continue; // Skip rows without phone

      // Distribution Logic
      let assignTo = req.user.userId; // Default to uploader
      let branch_id = globalBranchId || uploaderInfo.branch_id || null;
      let branch_name = globalBranchName || uploaderInfo.branch_name || null;
      let department_id = globalDepartmentId || uploaderInfo.department_id || null;
      let department_name = globalDepartmentName || uploaderInfo.department_name || null;

      if (assignments && assignments.length > 0 && currentUserAssignmentIndex < assignments.length) {
        const currentAssignment = assignments[currentUserAssignmentIndex];
        assignTo = currentAssignment.userId;
        
        // Only use agent's branch/dept if global wasn't provided
        const targetUserDetails = userDetailsMap[assignTo];
        if (targetUserDetails) {
          if (!globalBranchId) branch_id = targetUserDetails.branch_id;
          if (!globalBranchName) branch_name = targetUserDetails.branch_name;
          if (!globalDepartmentId) department_id = targetUserDetails.department_id;
          if (!globalDepartmentName) department_name = targetUserDetails.department_name;
        }
        
        currentUserCount++;
        if (currentUserCount >= currentAssignment.count) {
          currentUserAssignmentIndex++;
          currentUserCount = 0;
        }
      }

      const userList = [assignTo];
      const enquiryForId = globalEnquirySourceId || null;
      const statusId = globalStatusId || null;

      const [result] = await conn.query(
        `INSERT INTO contacts 
         (business_id, name, phone, email, tags, address, opt_in_source, assigned_to, branch_id, branch_name, department_id, department_name, user_list, enquiry_for_id, status_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE name=VALUES(name), tags=VALUES(tags), address=VALUES(address), assigned_to=VALUES(assigned_to), branch_id=VALUES(branch_id), branch_name=VALUES(branch_name), department_id=VALUES(department_id), department_name=VALUES(department_name), user_list=VALUES(user_list), enquiry_for_id=IFNULL(VALUES(enquiry_for_id), enquiry_for_id), status_id=IFNULL(VALUES(status_id), status_id)`,
        [bizId, name, phone, email, tags, address, 'import', assignTo, branch_id, branch_name, department_id, department_name, JSON.stringify(userList), enquiryForId, statusId]
      );
      
      // Check if it's a new insert or update by checking affectedRows.
      // If it's a new insert, let's create a follow_up entry.
      // 1 means inserted, 2 means updated
      if (result.affectedRows === 1) {
        await conn.query(
          'INSERT INTO follow_ups (contact_id, contact_name, by_user_id, to_user_id, branch_id, branch_name, department_id, department_name, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, name, req.user.userId, assignTo, branch_id, branch_name, department_id, department_name, 'Contact imported']
        );
      }
      
      imported++;
    }
    
    await conn.commit();
    fs.unlinkSync(req.file.path);
    res.json({ success: true, data: { imported }, message: `${imported} contacts imported successfully` });
  } catch (err) {
    await conn.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: err.message, data: null });
  } finally {
    conn.release();
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
    res.send('<html><body><h2>âœ… You have successfully opted in!</h2></body></html>');
  } catch (err) {
    res.status(500).send('Error processing opt-in');
  }
};

const getUniqueTags = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const [rows] = await pool.query('SELECT tags FROM contacts WHERE business_id = ? AND tags IS NOT NULL', [bizId]);
    const tags = new Set();
    rows.forEach(r => {
      let ct = r.tags;
      if (typeof ct === 'string') {
        try { ct = JSON.parse(ct); } catch (e) { ct = []; }
      }
      if (Array.isArray(ct)) {
        ct.forEach(t => {
          if (t && typeof t === 'string' && t.trim()) {
            tags.add(t.trim());
          }
        });
      }
    });
    res.json({ success: true, data: Array.from(tags), message: 'OK' });
  } catch (err) {
    console.error('[getUniqueTags] Error:', err.message);
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
    const accessibleUserIds = await getAccessibleUserIds(req.user, bizId);
    if (accessibleUserIds !== null) {
      if (accessibleUserIds.length === 0) {
        q += ' AND 1 = 0 ';
      } else {
        q += ` AND assigned_to IN (${accessibleUserIds.map(() => '?').join(',')})`;
        params.push(...accessibleUserIds);
      }
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
    let fileUrl = `/uploads/${folder}/${req.file.filename}`;

    // Upload to Cloudflare R2 if configured
    if (r2Service.isConfigured()) {
      try {
        const r2Key = `${folder}/${req.file.filename}`;
        await r2Service.uploadFile({
          key: r2Key,
          filePath: req.file.path,
          contentType: req.file.mimetype || 'application/octet-stream',
          metadata: {
            contactId: String(contactId),
            originalName: encodeURIComponent(req.file.originalname)
          }
        });
        if (r2Service.publicUrl) {
          fileUrl = `${r2Service.publicUrl}/${r2Key}`;
        }
      } catch (r2Err) {
        console.error('Error uploading contact document to Cloudflare R2:', r2Err);
      }
    }
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

const deleteContactDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const bizId = req.user.businessId;

    const [docs] = await pool.query(
      'SELECT * FROM user_document_upload WHERE id = ? AND contact_id = ? AND business_id = ?',
      [docId, id, bizId]
    );
    if (!docs || docs.length === 0) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const doc = docs[0];
    if (r2Service.isConfigured() && doc.file_url) {
      let r2Key;
      if (doc.file_url.startsWith('http')) {
        try {
          const u = new URL(doc.file_url);
          r2Key = u.pathname.replace(/^\/+/, '');
        } catch (e) {
          const filename = path.basename(doc.file_url);
          const folder = doc.file_url.includes('/csv/') ? 'csv' : 'media';
          r2Key = `${folder}/${filename}`;
        }
      } else {
        const filename = path.basename(doc.file_url);
        const folder = doc.file_url.includes('/csv/') ? 'csv' : 'media';
        r2Key = `${folder}/${filename}`;
      }
      await r2Service.deleteFile(r2Key);
    }

    await pool.query('DELETE FROM user_document_upload WHERE id = ?', [docId]);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const importExcelContacts = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { leads, statusAndAssignment } = req.body;
    const bizId  = req.user.businessId;
    const userId = req.user.userId;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ success: false, message: 'No lead data provided.', data: null });
    }

    const { status, branch, department, assigned_employee, remark, follow_up_date, loss_reason } = statusAndAssignment || {};

    // ── Resolve status ────────────────────────────────────
    let statusId   = null, statusName = status ? status.trim() : null;
    let sale_won = 0, sale_lost = 0, sale_won_date = null, sale_lost_date = null, sale_won_by = null, sale_lost_by = null;
    if (statusName) {
      const [sRows] = await conn.query('SELECT id, name FROM statuses WHERE TRIM(name) = ? OR name = ? LIMIT 1', [statusName, statusName]);
      if (sRows.length > 0) {
        statusId = sRows[0].id;
        statusName = sRows[0].name;
      }
    }

    // ── Resolve branch ────────────────────────────────────
    let branchId = null, branchName = branch || null;
    if (branchName) {
      const [bRows] = await conn.query('SELECT id FROM branches WHERE name = ? LIMIT 1', [branchName]);
      if (bRows.length > 0) branchId = bRows[0].id;
    }

    // ── Resolve department ────────────────────────────────
    let departmentId = null, departmentName = department || null;
    if (departmentName) {
      const [dRows] = await conn.query('SELECT id FROM departments WHERE name = ? LIMIT 1', [departmentName]);
      if (dRows.length > 0) departmentId = dRows[0].id;
    }

    // ── Resolve assigned user ─────────────────────────────
    let assignedTo = null;
    if (assigned_employee) {
      const [uRows] = await conn.query('SELECT id FROM users WHERE name = ? AND business_id = ? LIMIT 1', [assigned_employee, bizId]);
      if (uRows.length > 0) assignedTo = uRows[0].id;
    }
    if (!assignedTo) assignedTo = userId;

    // ── Follow-up date ────────────────────────────────────
    let formattedFollowUpDate = null;
    if (follow_up_date) {
      try { formattedFollowUpDate = new Date(follow_up_date).toISOString().split('T')[0]; } catch {}
    }

    // ── User names for follow_ups record ─────────────────
    let byUserName = null, toUserName = null;
    const [uNameRows] = await conn.query('SELECT name FROM users WHERE id = ? LIMIT 1', [userId]);
    if (uNameRows.length) byUserName = uNameRows[0].name;
    const [tuRows] = await conn.query('SELECT name FROM users WHERE id = ? LIMIT 1', [assignedTo]);
    if (tuRows.length) toUserName = tuRows[0].name;

    // ── Flexible case-insensitive column finder ───────────
    // Works with ANY Excel column headers (e.g. "STUDENT NAME", "Mobile No", "Phone No.", etc.)
    const getCol = (row, keywords) => {
      const keys = Object.keys(row);
      for (const kw of keywords) {
        const found = keys.find(k => k.trim().toLowerCase() === kw.toLowerCase());
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
          return String(row[found]).trim();
        }
      }
      // Partial match fallback
      for (const kw of keywords) {
        const found = keys.find(k => k.trim().toLowerCase().includes(kw.toLowerCase()));
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
          return String(row[found]).trim();
        }
      }
      return '';
    };

    // Log actual column headers from first row for debugging
    if (leads.length > 0) {
      console.log('[importExcelContacts] Excel column headers:', Object.keys(leads[0]));
      console.log('[importExcelContacts] First row sample:', JSON.stringify(leads[0]));
    }

    // ── Process each Excel row ────────────────────────────
    let inserted = 0, skipped = 0;
    const errors = [];
    const invalidEmails = [];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    for (let rowIndex = 0; rowIndex < leads.length; rowIndex++) {
      const row = leads[rowIndex];
      const actualRowNumber = rowIndex + 2; // Assuming row 1 is header
      try {
        const name    = getCol(row, ['Name', 'Full Name', 'Customer Name', 'Student Name', 'Client Name', 'Lead Name', 'Contact Name', 'Person Name', 'Applicant Name', 'Candidate Name']);
        let   phone   = getCol(row, ['Phone', 'Mobile', 'Phone Number', 'Mobile Number', 'Mobile No', 'Phone No', 'Contact Number', 'Contact No', 'Whatsapp', 'WhatsApp No', 'Cell', 'Tel', 'Telephone', 'Number', 'Contact']);
        let   email   = getCol(row, ['Email', 'Email Address', 'Mail', 'E-Mail', 'Email Id', 'Email ID']) || null;
        const tags    = getCol(row, ['Tags', 'Tag', 'Labels', 'Category', 'Course', 'Program']);
        const address = getCol(row, ['Address', 'Location', 'City', 'Place', 'Area']) || null;

        // Skip completely empty rows
        if (!name && !phone) {
          skipped++;
          if (inserted === 0 && skipped === 1) {
            console.warn('[importExcelContacts] First row skipped - no name/phone found. Row keys:', Object.keys(row), 'Row data:', JSON.stringify(row));
          }
          continue;
        }

        // Validate and clean email
        if (email) {
          email = email.trim();
          if (!emailRegex.test(email)) {
            invalidEmails.push({
              row: actualRowNumber,
              name: name || 'Unnamed Lead',
              email: email,
              error: 'Invalid email format'
            });
            // Keep email null on the contact record so bad email isn't saved as valid
            email = null;
          }
        }

        // Phone sanitisation
        if (phone) {
          phone = phone.replace(/\D/g, '');               // strip non-digits
          if (phone.length === 10) phone = '91' + phone;  // auto-prefix
          if (phone.length !== 12) {
            skipped++;
            errors.push('Skipped "' + (name || phone) + '": phone invalid (got ' + phone.length + ' digits after cleaning: ' + phone + ')');
            continue;
          }
          const last10 = phone.slice(-10);
          const [dupRows] = await conn.query('SELECT id FROM contacts WHERE business_id = ? AND phone LIKE ? LIMIT 1', [bizId, '%' + last10]);
          if (dupRows.length > 0) { skipped++; errors.push('Skipped "' + name + '": phone ' + phone + ' already exists'); continue; }
        }

        const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const userList  = [assignedTo];

        // INSERT — columns match trackbox_v2.contacts exactly (no current_sale_status)
        const [result] = await conn.query(
          'INSERT INTO contacts (business_id, name, phone, email, tags, channel_preference, assigned_to, address, follow_up_date, follow_up, branch_id, branch_name, department_id, department_name, status_id, status_name, sale_won, sale_won_date, sale_won_by, sale_lost, sale_lost_date, sale_lost_by, created_by_user, user_list, loss_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [bizId, name || null, phone || null, email, JSON.stringify(tagsArray), 'whatsapp', assignedTo, address, formattedFollowUpDate, formattedFollowUpDate ? 1 : 0, branchId, branchName, departmentId, departmentName, statusId, statusName, sale_won, sale_won_date, sale_won_by, sale_lost, sale_lost_date, sale_lost_by, userId, JSON.stringify(userList), loss_reason || null]
        );
        const contactId = result.insertId;

        // follow_ups record
        await conn.query(
          'INSERT INTO follow_ups (contact_id, contact_name, follow_up_date, by_user_id, by_user_name, to_user_id, to_user_name, status_id, status_name, branch_id, branch_name, department_id, department_name, remarks) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [contactId, name || null, formattedFollowUpDate, userId, byUserName, assignedTo, toUserName, statusId, statusName, branchId, branchName, departmentId, departmentName, remark || 'Imported via Excel']
        );

        inserted++;
      } catch (rowErr) {
        skipped++;
        console.error('[importExcelContacts] row error:', rowErr.message, rowErr);
        errors.push(rowErr.message);
      }
    }

    await conn.commit();

    const detectedCols = leads.length > 0 ? Object.keys(leads[0]) : [];
    if (inserted === 0) {
      return res.json({
        success: false,
        message: '0 leads imported. ' + skipped + ' rows skipped.' + (errors.length ? ' Errors: ' + errors.slice(0, 5).join(' | ') : ' Check that your Excel has columns matching: Name, Phone/Mobile, Email, Address, Tags.'),
        data: { inserted, skipped, errors, invalidEmails, detectedColumns: detectedCols }
      });
    }
    return res.json({
      success: true,
      message: 'Import complete. ' + inserted + ' lead(s) imported' + (skipped ? ', ' + skipped + ' skipped' : '') + '.',
      data: { inserted, skipped, errors, invalidEmails, detectedColumns: detectedCols }
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error('[importExcelContacts] fatal:', err);
    return res.status(500).json({ success: false, message: err.message, data: null });
  } finally {
    if (conn) conn.release();
  }
};
const brevoService = require('../services/brevo.service');

// Helper to build filtering WHERE clause matching getContacts
const buildContactFilterWhere = (bizId, user, { channel, status, tag, search, agent, transferred_only }) => {
  let where = 'WHERE c.business_id = ?';
  const params = [bizId];

  if (user.role === 'agent') {
    const selfId = Number(user.userId);
    if (transferred_only === 'true') {
      where += ` AND (JSON_CONTAINS(c.user_list, JSON_QUOTE(?)) OR JSON_CONTAINS(c.user_list, ?)) AND (c.assigned_to != ? OR c.assigned_to IS NULL)`;
      params.push(selfId.toString(), selfId.toString(), selfId);
    } else {
      where += ` AND (c.assigned_to = ? OR JSON_CONTAINS(c.user_list, JSON_QUOTE(?)) OR JSON_CONTAINS(c.user_list, ?))`;
      params.push(selfId, selfId.toString(), selfId.toString());
    }
  } else {
    if (transferred_only === 'true') {
      if (agent) {
        where += ` AND (JSON_CONTAINS(c.user_list, JSON_QUOTE(?)) OR JSON_CONTAINS(c.user_list, ?)) AND (c.assigned_to != ? OR c.assigned_to IS NULL)`;
        params.push(agent.toString(), agent, agent);
      } else {
        where += ` AND JSON_LENGTH(c.user_list) > 1`;
      }
    } else if (agent) {
      where += ' AND c.assigned_to = ?';
      params.push(agent);
    }
  }

  if (channel) {
    where += ' AND c.channel_preference = ?';
    params.push(channel);
  }
  if (status === 'No Follow Up' || status === 'no_followup' || (status && status.trim() === 'NO DATE')) {
    where += ' AND c.follow_up_date IS NULL';
  } else if (status) {
    where += ' AND c.status_name = ?';
    params.push(status);
  }
  if (search) {
    where += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (tag) {
    where += ' AND JSON_CONTAINS(c.tags, ?)';
    params.push(JSON.stringify(tag));
  }

  return { where, params };
};

/**
 * Preview recipients for bulk email send
 * Supports filtering by channel, status, tag, search, agent, transferred_only
 * AND optional selected_contact_ids (if user checked specific leads)
 */
const previewBulkEmail = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const { channel, status, tag, search, agent, transferred_only, selected_contact_ids } = req.body;
    let { where, params } = buildContactFilterWhere(bizId, req.user, { channel, status, tag, search, agent, transferred_only });

    if (Array.isArray(selected_contact_ids) && selected_contact_ids.length > 0) {
      where += ` AND c.id IN (${selected_contact_ids.map(() => '?').join(',')})`;
      params.push(...selected_contact_ids.map(id => Number(id)));
    }

    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.email, c.phone, c.status_name
      FROM contacts c
      ${where}
      ORDER BY c.id DESC
    `, params);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const validRecipients = [];
    const invalidRecipients = [];
    const missingRecipients = [];

    rows.forEach(contact => {
      const rawEmail = contact.email ? String(contact.email).trim() : '';
      if (!rawEmail) {
        missingRecipients.push({
          id: contact.id,
          name: contact.name || 'Unnamed Lead',
          phone: contact.phone || null,
          error: 'Missing email address'
        });
      } else if (!emailRegex.test(rawEmail)) {
        invalidRecipients.push({
          id: contact.id,
          name: contact.name || 'Unnamed Lead',
          email: rawEmail,
          phone: contact.phone || null,
          error: 'Invalid email format'
        });
      } else {
        validRecipients.push({
          id: contact.id,
          name: contact.name || 'Unnamed Lead',
          email: rawEmail,
          phone: contact.phone || null
        });
      }
    });

    return res.json({
      success: true,
      data: {
        totalMatched: rows.length,
        validCount: validRecipients.length,
        invalidCount: invalidRecipients.length,
        missingCount: missingRecipients.length,
        validRecipients: validRecipients,
        invalidRecipients: invalidRecipients,
        missingRecipients: missingRecipients // Full list of missing
      }
    });
  } catch (err) {
    console.error('[previewBulkEmail] error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Send bulk email via Brevo to valid recipients matching filters or selected IDs
 * Saves rendered email record per recipient in lead_emails with initial status 'queued'
 */
const sendBulkEmail = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const { channel, status, tag, search, agent, transferred_only, selected_contact_ids, template_id, subject, body } = req.body;

    console.log('[sendBulkEmail] Invocation started:', {
      businessId: bizId,
      selected_contact_ids,
      subject
    });

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Message body is required' });
    }

    let { where, params } = buildContactFilterWhere(bizId, req.user, { channel, status, tag, search, agent, transferred_only });

    if (Array.isArray(selected_contact_ids) && selected_contact_ids.length > 0) {
      where += ` AND c.id IN (${selected_contact_ids.map(() => '?').join(',')})`;
      params.push(...selected_contact_ids.map(id => Number(id)));
    }

    const [rows] = await pool.query(`
      SELECT c.id, c.name, c.email, c.phone, c.status_name
      FROM contacts c
      ${where}
      ORDER BY c.id DESC
    `, params);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const validRecipients = [];
    const skippedMissing = [];
    const skippedInvalid = [];

    rows.forEach(c => {
      const em = c.email ? String(c.email).trim() : '';
      if (!em) {
        skippedMissing.push({ id: c.id, name: c.name || 'Unnamed Lead', phone: c.phone });
      } else if (!emailRegex.test(em)) {
        skippedInvalid.push({ id: c.id, name: c.name || 'Unnamed Lead', email: em, phone: c.phone });
      } else {
        validRecipients.push({
          id: c.id,
          name: c.name || 'Valued Customer',
          email: em,
          phone: c.phone
        });
      }
    });

    console.log(`[sendBulkEmail] Total matched contacts: ${rows.length}. validRecipients.length: ${validRecipients.length}, skippedMissing: ${skippedMissing.length}, skippedInvalid: ${skippedInvalid.length}`);

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid email recipients found matching the selected filters/leads.',
        data: {
          skippedMissing,
          skippedInvalid
        }
      });
    }

    const campaignId = `CAMP-${Date.now()}`;
    const sender = brevoService.getSender();
    let sentCount = 0;
    let failedCount = 0;
    const sendResults = [];

    for (const recipient of validRecipients) {
      if (recipient.email.toLowerCase() === sender.email.toLowerCase()) {
        console.warn(`[sendBulkEmail] WARNING: Lead email ${recipient.email} is identical to BREVO_SENDER_EMAIL ${sender.email}. Proceeding with send.`);
      }

      const firstName = (recipient.name || '').split(' ')[0] || 'there';
      const personalizedSubject = subject
        .replace(/\{\{first_name\}\}/gi, firstName)
        .replace(/\{\{name\}\}/gi, recipient.name);

      const personalizedBody = body
        .replace(/\{\{first_name\}\}/gi, firstName)
        .replace(/\{\{name\}\}/gi, recipient.name);

      let initialStatus = 'queued'; // Status is 'queued' until Brevo confirms delivery via webhook or polling
      let brevoMsgId = null;
      let failureReason = null;

      try {
        console.log(`[sendBulkEmail] Sending email to contact ${recipient.id} (${recipient.email}) from ${sender.email}...`);
        const brevoRes = await brevoService.sendEmail({
          toEmail: recipient.email,
          toName: recipient.name,
          subject: personalizedSubject,
          htmlContent: personalizedBody.replace(/\n/g, '<br/>'),
          textContent: personalizedBody
        });
        // Normalize messageId by trimming angle brackets < >
        brevoMsgId = brevoRes.messageId ? brevoRes.messageId.replace(/[<>]/g, '').trim() : null;
        console.log(`[sendBulkEmail] Brevo accepted email for contact ${recipient.id} (${recipient.email}), messageId: ${brevoMsgId}`);
        sentCount++;
      } catch (sendErr) {
        initialStatus = 'failed';
        failureReason = sendErr.message;
        failedCount++;
        console.error(`[sendBulkEmail] Failed sending to contact ${recipient.id} (${recipient.email}):`, sendErr.message);
      }

      // Save email record into lead_emails linked to student/lead
      try {
        const [insertRes] = await pool.query(`
          INSERT INTO lead_emails (
            business_id, contact_id, campaign_id, brevo_message_id, 
            sender_email, to_email, subject, content, status, bounce_reason, sent_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          bizId,
          recipient.id,
          campaignId,
          brevoMsgId,
          sender.email,
          recipient.email,
          personalizedSubject,
          personalizedBody,
          initialStatus,
          failureReason
        ]);
        console.log(`[sendBulkEmail] Inserted into lead_emails for contact ${recipient.id} (id: ${insertRes.insertId}, status: ${initialStatus}, brevo_id: ${brevoMsgId})`);
      } catch (dbErr) {
        console.error(`[sendBulkEmail] FATAL: Error inserting into lead_emails for contact ${recipient.id}:`, dbErr);
      }

      sendResults.push({
        contactId: recipient.id,
        name: recipient.name,
        email: recipient.email,
        status: initialStatus,
        messageId: brevoMsgId,
        error: failureReason
      });
    }

    const isSuccess = sentCount > 0;
    return res.json({
      success: isSuccess,
      message: isSuccess
        ? `${sentCount} email(s) accepted by Brevo, ${failedCount} failed. Delivery status will update shortly.`
        : `Email delivery failed: ${sendResults[0]?.error || 'Unable to deliver emails via Brevo.'}`,
      data: {
        campaignId,
        totalRecipients: validRecipients.length,
        sentCount,
        failedCount,
        skippedMissing,
        skippedInvalid,
        results: sendResults
      }
    });

  } catch (err) {
    console.error('[sendBulkEmail] error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Fallback Refresh Endpoint: Poll Brevo directly for delivery statuses
 * POST /api/contacts/email-status/refresh { campaign_id }
 */
const refreshEmailStatus = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const { campaign_id } = req.body;

    if (!campaign_id) {
      return res.status(400).json({ success: false, message: 'campaign_id is required' });
    }

    const [rows] = await pool.query(`
      SELECT le.*, c.name as contact_name 
      FROM lead_emails le
      LEFT JOIN contacts c ON le.contact_id = c.id
      WHERE le.campaign_id = ? AND le.business_id = ?
    `, [campaign_id, bizId]);

    if (rows.length === 0) {
      return res.json({ success: true, data: { updatedRows: [] } });
    }

    const updatedRows = [];

    for (const record of rows) {
      // Check if candidate for refresh (still in queued or deferred)
      if (record.brevo_message_id && (record.status === 'queued' || record.status === 'deferred')) {
        const eventsData = await brevoService.getEmailEventsByMessageId(record.brevo_message_id);

        if (eventsData && Array.isArray(eventsData.events) && eventsData.events.length > 0) {
          // Sort events by date ascending
          const sortedEvents = eventsData.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          let resolvedStatus = record.status;
          let bounceReason = record.bounce_reason;
          let deliveredAt = record.delivered_at;
          let openedAt = record.opened_at;
          let clickedAt = record.clicked_at;
          let lastEvent = record.last_event;

          for (const ev of sortedEvents) {
            const evName = (ev.name || '').toLowerCase();
            lastEvent = evName;
            if (evName === 'delivered') {
              resolvedStatus = 'delivered';
              deliveredAt = ev.date ? new Date(ev.date) : new Date();
            } else if (evName === 'opened' || evName === 'unique_opened') {
              resolvedStatus = 'opened';
              openedAt = ev.date ? new Date(ev.date) : new Date();
            } else if (evName === 'clicks') {
              resolvedStatus = 'clicked';
              clickedAt = ev.date ? new Date(ev.date) : new Date();
            } else if (evName === 'soft_bounces') {
              resolvedStatus = 'soft_bounce';
              bounceReason = ev.reason || 'Soft bounce';
            } else if (evName === 'hard_bounces') {
              resolvedStatus = 'hard_bounce';
              bounceReason = ev.reason || 'Hard bounce';
            } else if (evName === 'blocked') {
              resolvedStatus = 'blocked';
              bounceReason = ev.reason || 'Mailbox or domain blocked';
            } else if (evName === 'spam') {
              resolvedStatus = 'spam';
              bounceReason = 'Marked as spam';
            } else if (evName === 'invalid_email') {
              resolvedStatus = 'invalid_email';
              bounceReason = 'Invalid email address';
            } else if (evName === 'deferred') {
              resolvedStatus = 'deferred';
              bounceReason = ev.reason || 'Deferred by recipient server';
            }
          }

          if (resolvedStatus !== record.status || bounceReason !== record.bounce_reason) {
            await pool.query(`
              UPDATE lead_emails
              SET status = ?,
                  bounce_reason = ?,
                  delivered_at = ?,
                  opened_at = ?,
                  clicked_at = ?,
                  last_event = ?,
                  last_event_at = NOW(),
                  updated_at = NOW()
              WHERE id = ?
            `, [resolvedStatus, bounceReason, deliveredAt, openedAt, clickedAt, lastEvent, record.id]);

            record.status = resolvedStatus;
            record.bounce_reason = bounceReason;
            record.delivered_at = deliveredAt;
            record.opened_at = openedAt;
            record.clicked_at = clickedAt;
            record.last_event = lastEvent;
          }
        }
      }

      updatedRows.push({
        id: record.id,
        contactId: record.contact_id,
        name: record.contact_name || 'Valued Customer',
        email: record.to_email,
        status: record.status,
        reason: record.bounce_reason,
        deliveredAt: record.delivered_at,
        openedAt: record.opened_at,
        sentAt: record.sent_at
      });
    }

    return res.json({
      success: true,
      data: {
        updatedRows
      }
    });

  } catch (err) {
    console.error('[refreshEmailStatus] error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  getContacts, 
  getContact, 
  createContact, 
  updateContact, 
  deleteContact, 
  importContacts, 
  exportContacts, 
  optIn, 
  optOut, 
  createOptInLink, 
  handleOptInLink, 
  getUniqueTags, 
  getContactHistory, 
  getContactDocuments, 
  uploadContactDocument, 
  deleteContactDocument,
  importExcelContacts,
  previewBulkEmail,
  sendBulkEmail,
  refreshEmailStatus
};

