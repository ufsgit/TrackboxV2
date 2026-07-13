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
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE business_id=? ORDER BY created_at ASC',
      [req.user.businessId]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const inviteAgent = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const [existing] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already in use', data: null });
    const hash = await bcrypt.hash(password || 'WLink@123', 10);
    const [result] = await pool.query(
      'INSERT INTO users (business_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [req.user.businessId, name, email, hash, role || 'agent']
    );
    const [rows] = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Agent invited' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateAgent = async (req, res) => {
  try {
    const { role, is_active } = req.body;
    await pool.query('UPDATE users SET role=?,is_active=? WHERE id=? AND business_id=?', [role, is_active, req.params.id, req.user.businessId]);
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
    const { platform, account_name, phone_number, phone_id, account_id, token, verify_token, waba_id, app_id, app_secret } = req.body;
    const [result] = await pool.query(
      `INSERT INTO social_accounts (business_id, platform, account_name, phone_number, phone_id, account_id, token, verify_token, waba_id, app_id, app_secret) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        app_secret || null
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
    const { account_name, phone_number, phone_id, account_id, token, verify_token, waba_id, app_id, app_secret, is_active } = req.body;
    await pool.query(
      `UPDATE social_accounts SET 
        account_name=?, phone_number=?, phone_id=?, account_id=?, token=?, verify_token=?, waba_id=?, app_id=?, app_secret=?, is_active=?
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
      'SELECT * FROM lead_fields WHERE business_id=? ORDER BY display_order ASC, id ASC',
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
    const { label, field_type, options, is_required, display_order } = req.body;
    if (!label || !field_type) return res.status(400).json({ success: false, message: 'label and field_type are required', data: null });
    // Generate a slug key from label
    const field_key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').substring(0, 80);
    const optionsJson = field_type === 'dropdown' && Array.isArray(options) ? JSON.stringify(options) : null;
    const [result] = await pool.query(
      'INSERT INTO lead_fields (business_id, label, field_key, field_type, options, is_required, display_order) VALUES (?,?,?,?,?,?,?)',
      [req.user.businessId, label, field_key, field_type, optionsJson, is_required ? 1 : 0, display_order || 0]
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
    const { label, field_type, options, is_required, display_order } = req.body;
    const optionsJson = field_type === 'dropdown' && Array.isArray(options) ? JSON.stringify(options) : null;
    await pool.query(
      'UPDATE lead_fields SET label=?, field_type=?, options=?, is_required=?, display_order=? WHERE id=? AND business_id=?',
      [label, field_type, optionsJson, is_required ? 1 : 0, display_order || 0, req.params.id, req.user.businessId]
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

