const pool = require('../db/pool');
const SmsService = require('../services/SmsService');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

// DLT Templates
const getDltTemplates = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sms_dlt_templates WHERE business_id=? ORDER BY created_at DESC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const createDltTemplate = async (req, res) => {
  try {
    const { dlt_template_id, template_name, message, type } = req.body;
    const [result] = await pool.query(
      'INSERT INTO sms_dlt_templates (business_id, dlt_template_id, template_name, message, type) VALUES (?, ?, ?, ?, ?)',
      [req.user.businessId, dlt_template_id, template_name, message, type||'transactional']
    );
    const [rows] = await pool.query('SELECT * FROM sms_dlt_templates WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'DLT template created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const updateDltTemplate = async (req, res) => {
  try {
    const { dlt_template_id, template_name, message, type, status } = req.body;
    await pool.query(
      'UPDATE sms_dlt_templates SET dlt_template_id=?,template_name=?,message=?,type=?,status=? WHERE id=? AND business_id=?',
      [dlt_template_id, template_name, message, type||'transactional', status||'pending', req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM sms_dlt_templates WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const deleteDltTemplate = async (req, res) => {
  try {
    await pool.query('DELETE FROM sms_dlt_templates WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

// SMS Campaigns
const getSmsCampaigns = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM sms_campaigns WHERE business_id=?', [req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM sms_campaigns WHERE business_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.businessId, lim, offset]);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const createSmsCampaign = async (req, res) => {
  try {
    const { name, sender_id, dlt_template_id, message, target_tags, scheduled_at } = req.body;
    const [result] = await pool.query(
      'INSERT INTO sms_campaigns (business_id, name, sender_id, dlt_template_id, message, target_tags, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, sender_id||'', dlt_template_id||'', message, JSON.stringify(target_tags||[]), scheduled_at||null, scheduled_at?'scheduled':'draft']
    );
    const [rows] = await pool.query('SELECT * FROM sms_campaigns WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Campaign created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const sendSmsCampaign = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sms_campaigns WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const camp = rows[0];
    const tags = camp.target_tags || [];
    let contacts = [];
    if (tags.length) {
      const [all] = await pool.query('SELECT phone FROM contacts WHERE business_id=? AND opted_in=1', [camp.business_id]);
      contacts = all;
    }
    let sent = 0, failed = 0;
    for (const c of contacts) {
      const result = await SmsService.send(c.phone, camp.message, camp.sender_id);
      if (result.success) sent++; else failed++;
    }
    await pool.query("UPDATE sms_campaigns SET status='completed', total_sent=?, total_failed=? WHERE id=?", [sent, failed, camp.id]);
    res.json({ success: true, data: { sent, failed }, message: 'Campaign sent' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};
const getSmsCampaignReport = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sms_campaigns WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    res.json({ success: true, data: rows[0], message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getDltTemplates, createDltTemplate, updateDltTemplate, deleteDltTemplate, getSmsCampaigns, createSmsCampaign, sendSmsCampaign, getSmsCampaignReport };
