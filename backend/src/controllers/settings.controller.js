const pool = require('../db/pool');
const bcrypt = require('bcrypt');

const getBusiness = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM businesses WHERE id=?', [req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    
    const business = rows[0];
    if (!business.fb_verify_token) {
      business.fb_verify_token = 'urban_verify_token_' + req.user.businessId;
    }
    
    res.json({ success: true, data: business, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateBusiness = async (req, res) => {
  try {
    const { name, whatsapp_number, whatsapp_token, whatsapp_phone_id, waba_id, fb_page_id, fb_token, ig_account_id, ig_token, ig_app_id, ig_app_secret, fb_verify_token } = req.body;
    await pool.query(
      'UPDATE businesses SET name=?,whatsapp_number=?,whatsapp_token=?,whatsapp_phone_id=?,waba_id=?,fb_page_id=?,fb_token=?,ig_account_id=?,ig_token=?,ig_app_id=?,ig_app_secret=?,fb_verify_token=? WHERE id=?',
      [name, whatsapp_number||'', whatsapp_token||null, whatsapp_phone_id||null, waba_id||null, fb_page_id||null, fb_token||null, ig_account_id||null, ig_token||null, ig_app_id||null, ig_app_secret||null, fb_verify_token||null, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM businesses WHERE id=?', [req.user.businessId]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getTeam = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.username, u.employee_code, u.designation_id, u.date_of_joining, u.role, u.is_active, u.created_at, u.branch_id, u.department_id, u.permissions, b.name as branch_name, d.name as department_name, des.name as designation_name
       FROM users u 
       LEFT JOIN branches b ON u.branch_id = b.id 
       LEFT JOIN departments d ON u.department_id = d.id 
       LEFT JOIN designations des ON u.designation_id = des.id
       WHERE u.business_id=? ORDER BY u.created_at ASC`,
      [req.user.businessId]
    );
    // For each agent, load their personal team member IDs
    for (const r of rows) {
      const [tmRows] = await pool.query(
        `SELECT tm.user_id FROM team_members tm
         JOIN teams t ON tm.team_id = t.id
         WHERE t.name = ? AND t.business_id = ? AND tm.user_id != ?`,
        [`__agent_${r.id}`, req.user.businessId, r.id]
      );
      r.member_ids = tmRows.map(m => m.user_id);
      if (typeof r.permissions === 'string') {
        try { r.permissions = JSON.parse(r.permissions); } catch(e) {}
      }
    }
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const inviteAgent = async (req, res) => {
  try {
    const { name, email, username, employee_code, designation_id, date_of_joining, role, password, branch_id, department_id, is_active, member_ids } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already in use', data: null });
    
    if (username) {
      const [existingUsername] = await pool.query('SELECT id FROM users WHERE username=? AND business_id=?', [username, req.user.businessId]);
      if (existingUsername.length) return res.status(409).json({ success: false, message: 'Username already in use', data: null });
    }
    const hash = await bcrypt.hash(password || 'Trackbox@123', 10);
    const [result] = await pool.query(
      'INSERT INTO users (business_id, name, email, username, employee_code, designation_id, date_of_joining, password_hash, role, branch_id, department_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, email, username || null, employee_code || null, designation_id || null, date_of_joining || null, hash, role || 'agent', branch_id || null, department_id || null, is_active === false ? 0 : 1]
    );
    const newUserId = result.insertId;

    // Create a personal auto-team for this agent and add member_ids + themselves
    if (member_ids && Array.isArray(member_ids) && member_ids.length > 0) {
      const [teamResult] = await pool.query(
        'INSERT INTO teams (name, description, business_id) VALUES (?, ?, ?)',
        [`__agent_${newUserId}`, null, req.user.businessId]
      );
      const teamId = teamResult.insertId;
      const allMembers = [...new Set([newUserId, ...member_ids.map(Number)])];
      const values = allMembers.map(uid => [teamId, uid]);
      await pool.query('INSERT INTO team_members (team_id, user_id) VALUES ?', [values]);
    }
    
    const [rows] = await pool.query('SELECT id, name, email, username, employee_code, designation_id, date_of_joining, role, is_active, branch_id, department_id, created_at FROM users WHERE id=?', [newUserId]);
    rows[0].member_ids = member_ids || [];
    res.status(201).json({ success: true, data: rows[0], message: 'Agent invited' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateAgent = async (req, res) => {
  try {
    const { name, username, employee_code, designation_id, date_of_joining, role, is_active, branch_id, department_id, password, member_ids } = req.body;
    
    if (username) {
      const [existing] = await pool.query('SELECT id FROM users WHERE username=? AND business_id=? AND id != ?', [username, req.user.businessId, req.params.id]);
      if (existing.length) return res.status(409).json({ success: false, message: 'Username already in use', data: null });
    }

    let query = 'UPDATE users SET name=?, username=?, employee_code=?, designation_id=?, date_of_joining=?, role=?, is_active=?, branch_id=?, department_id=?';
    let params = [name, username || null, employee_code || null, designation_id || null, date_of_joining || null, role, is_active === false ? 0 : 1, branch_id || null, department_id || null];
    
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      query += ', password_hash=?';
      params.push(hash);
    }
    
    query += ' WHERE id=? AND business_id=?';
    params.push(req.params.id, req.user.businessId);
    await pool.query(query, params);
    const agentId = Number(req.params.id);

    // Sync personal auto-team for this agent
    if (member_ids && Array.isArray(member_ids)) {
      // Delete existing auto-team for this agent
      const [existingTeams] = await pool.query(
        `SELECT id FROM teams WHERE name = ? AND business_id = ?`,
        [`__agent_${agentId}`, req.user.businessId]
      );
      for (const t of existingTeams) {
        await pool.query('DELETE FROM team_members WHERE team_id=?', [t.id]);
        await pool.query('DELETE FROM teams WHERE id=?', [t.id]);
      }
      if (member_ids.length > 0) {
        const [teamResult] = await pool.query(
          'INSERT INTO teams (name, description, business_id) VALUES (?, ?, ?)',
          [`__agent_${agentId}`, null, req.user.businessId]
        );
        const teamId = teamResult.insertId;
        const allMembers = [...new Set([agentId, ...member_ids.map(Number)])];
        const values = allMembers.map(uid => [teamId, uid]);
        await pool.query('INSERT INTO team_members (team_id, user_id) VALUES ?', [values]);
      }
    }
    
    res.json({ success: true, data: null, message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteAgent = async (req, res) => {
  try {
    if (req.params.id == req.user.userId) return res.status(400).json({ success: false, message: 'Cannot delete yourself', data: null });
    await pool.query('DELETE FROM users WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updatePermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    await pool.query(
      'UPDATE users SET permissions=? WHERE id=? AND business_id=?',
      [JSON.stringify(permissions || []), req.params.id, req.user.businessId]
    );
    res.json({ success: true, message: 'Permissions updated', data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getBilling = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT plan, green_tick_status FROM businesses WHERE id=?', [req.user.businessId]);
    const plans = {
      starter: { price: 999, contacts: 1000, broadcasts: 5, agents: 1 },
      pro: { price: 2999, contacts: 10000, broadcasts: 50, agents: 5 },
      enterprise: { price: 9999, contacts: 100000, broadcasts: 500, agents: 25 }
    };
    res.json({ success: true, data: { ...rows[0], plans }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const testWhatsAppConnection = async (req, res) => {
  try {
    const WhatsappService = require('../services/WhatsappService');
    const result = await WhatsappService.testConnection(req.user.businessId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getSocialAccounts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM social_accounts WHERE business_id=? ORDER BY created_at DESC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createSocialAccount = async (req, res) => {
  try {
    const { platform, account_name, phone_number, phone_id, account_id, token, verify_token, waba_id, app_id, app_secret, source_category_id } = req.body;
    const [result] = await pool.query(
      `INSERT INTO social_accounts (business_id, platform, account_name, phone_number, phone_id, account_id, token, verify_token, waba_id, app_id, app_secret, source_category_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.businessId,
        platform,
        account_name,
        phone_number || null,
        phone_id || null,
        account_id || null,
        token,
        verify_token || null,
        waba_id || null,
        app_id || null,
        app_secret || null,
        source_category_id || null
      ]
    );
    const [rows] = await pool.query('SELECT * FROM social_accounts WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Social account connected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateSocialAccount = async (req, res) => {
  try {
    const { account_name, phone_number, phone_id, account_id, token, verify_token, waba_id, app_id, app_secret, is_active, source_category_id } = req.body;
    await pool.query(
      `UPDATE social_accounts SET 
        account_name=?, phone_number=?, phone_id=?, account_id=?, token=?, verify_token=?, waba_id=?, app_id=?, app_secret=?, is_active=?, source_category_id=?
       WHERE id=? AND business_id=?`,
      [
        account_name,
        phone_number || null,
        phone_id || null,
        account_id || null,
        token,
        verify_token || null,
        waba_id || null,
        app_id || null,
        app_secret || null,
        is_active === undefined ? 1 : (is_active ? 1 : 0),
        source_category_id || null,
        req.params.id,
        req.user.businessId
      ]
    );
    const [rows] = await pool.query('SELECT * FROM social_accounts WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Social account updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteSocialAccount = async (req, res) => {
  try {
    await pool.query('DELETE FROM social_accounts WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Social account deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const testSocialAccountConnection = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM social_accounts WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Account not found', data: null });

    const account = rows[0];
    if (account.platform === 'whatsapp') {
      const WhatsappService = require('../services/WhatsappService');
      const result = await WhatsappService.testConnection(req.user.businessId, account.id);
      res.json(result);
    } else if (account.platform === 'instagram') {
      const InstagramService = require('../services/InstagramService');
      const result = await InstagramService.testConnection(req.user.businessId, account.id);
      res.json(result);
    } else if (account.platform === 'facebook') {
      const FacebookService = require('../services/FacebookService');
      const result = await FacebookService.testConnection(req.user.businessId, account.id);
      res.json(result);
    } else {
      res.json({ success: false, message: 'Testing not supported for this platform', data: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};


const getLeadFields = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT lf.*, fc.name as category_name 
       FROM lead_fields lf 
       LEFT JOIN field_categories fc ON lf.category_id = fc.id 
       WHERE lf.business_id=? 
       ORDER BY lf.display_order ASC, lf.id ASC`,
      [req.user.businessId]
    );
    const fields = rows.map(f => ({
      ...f,
      options: typeof f.options === 'string' ? JSON.parse(f.options || '[]') : (f.options || [])
    }));
    res.json({ success: true, data: fields, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createLeadField = async (req, res) => {
  try {
    const { label, field_type, options, is_required, display_order, category_id } = req.body;
    if (!label || !field_type) return res.status(400).json({ success: false, message: 'label and field_type are required', data: null });
    // Generate a slug key from label
    const field_key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').substring(0, 80);
    const optionsJson = field_type === 'dropdown' && Array.isArray(options) ? JSON.stringify(options) : null;
    const [result] = await pool.query(
      'INSERT INTO lead_fields (business_id, label, field_key, field_type, options, is_required, display_order, category_id) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.businessId, label, field_key, field_type, optionsJson, is_required ? 1 : 0, display_order || 0, category_id || null]
    );
    const [rows] = await pool.query('SELECT * FROM lead_fields WHERE id=?', [result.insertId]);
    const field = { ...rows[0], options: typeof rows[0].options === 'string' ? JSON.parse(rows[0].options || '[]') : (rows[0].options || []) };
    res.status(201).json({ success: true, data: field, message: 'Lead field created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'A field with a similar name already exists.', data: null });
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateLeadField = async (req, res) => {
  try {
    const { label, field_type, options, is_required, display_order, category_id } = req.body;
    const optionsJson = field_type === 'dropdown' && Array.isArray(options) ? JSON.stringify(options) : null;
    await pool.query(
      'UPDATE lead_fields SET label=?, field_type=?, options=?, is_required=?, display_order=?, category_id=? WHERE id=? AND business_id=?',
      [label, field_type, optionsJson, is_required ? 1 : 0, display_order || 0, category_id || null, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM lead_fields WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const field = { ...rows[0], options: typeof rows[0].options === 'string' ? JSON.parse(rows[0].options || '[]') : (rows[0].options || []) };
    res.json({ success: true, data: field, message: 'Lead field updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteLeadField = async (req, res) => {
  try {
    await pool.query('DELETE FROM lead_fields WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Lead field deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { 
  getBusiness, 
  updateBusiness, 
  getTeam, 
  inviteAgent, 
  updateAgent, 
  deleteAgent, 
  updatePermissions,
  getBilling, 
  testWhatsAppConnection,
  getSocialAccounts,
  createSocialAccount,
  updateSocialAccount,
  deleteSocialAccount,
  testSocialAccountConnection,
  getLeadFields,
  createLeadField,
  updateLeadField,
  deleteLeadField
};
