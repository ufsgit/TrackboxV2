const pool = require('../db/pool');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

// RCS Templates
const getRcsTemplates = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rcs_templates WHERE business_id=? ORDER BY created_at DESC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const createRcsTemplate = async (req, res) => {
  try {
    const { name, card_type, content } = req.body;
    const [result] = await pool.query('INSERT INTO rcs_templates (business_id, name, card_type, content) VALUES (?, ?, ?, ?)', [req.user.businessId, name, card_type, JSON.stringify(content||{})]);
    const [rows] = await pool.query('SELECT * FROM rcs_templates WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const updateRcsTemplate = async (req, res) => {
  try {
    const { name, card_type, content } = req.body;
    await pool.query('UPDATE rcs_templates SET name=?,card_type=?,content=? WHERE id=? AND business_id=?', [name, card_type, JSON.stringify(content||{}), req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM rcs_templates WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const deleteRcsTemplate = async (req, res) => {
  try {
    await pool.query('DELETE FROM rcs_templates WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

// RCS Campaigns
const getRcsCampaigns = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM rcs_campaigns WHERE business_id=?', [req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM rcs_campaigns WHERE business_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.businessId, lim, offset]);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const createRcsCampaign = async (req, res) => {
  try {
    const { name, sender_id, content, target_tags, scheduled_at } = req.body;
    const [result] = await pool.query(
      'INSERT INTO rcs_campaigns (business_id, name, sender_id, content, target_tags, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, sender_id||'', JSON.stringify(content||{}), JSON.stringify(target_tags||[]), scheduled_at||null, scheduled_at?'scheduled':'draft']
    );
    const [rows] = await pool.query('SELECT * FROM rcs_campaigns WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Campaign created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const sendRcsCampaign = async (req, res) => {
  try {
    const RcsService = require('../services/RcsService');
    const [rows] = await pool.query('SELECT * FROM rcs_campaigns WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    // Stub send - mark as completed
    await pool.query("UPDATE rcs_campaigns SET status='completed', total_sent=0 WHERE id=?", [req.params.id]);
    res.json({ success: true, data: { sent: 0 }, message: 'Campaign sent (RCS gateway not configured)' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const getRcsCampaignAnalytics = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rcs_campaigns WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    res.json({ success: true, data: rows[0], message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getRcsTemplates, createRcsTemplate, updateRcsTemplate, deleteRcsTemplate, getRcsCampaigns, createRcsCampaign, sendRcsCampaign, getRcsCampaignAnalytics };
