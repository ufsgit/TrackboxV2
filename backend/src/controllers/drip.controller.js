const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

const getDrip = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM drip_campaigns WHERE business_id=?', [req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM drip_campaigns WHERE business_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.businessId, lim, offset]);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createDrip = async (req, res) => {
  try {
    const { name, steps, trigger_event, trigger_tags } = req.body;
    const [result] = await pool.query(
      'INSERT INTO drip_campaigns (business_id, name, steps, trigger_event, trigger_tags) VALUES (?, ?, ?, ?, ?)',
      [req.user.businessId, name, JSON.stringify(steps||[]), trigger_event||'manual', JSON.stringify(trigger_tags||[])]
    );
    const [rows] = await pool.query('SELECT * FROM drip_campaigns WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Campaign created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateDrip = async (req, res) => {
  try {
    const { name, steps, trigger_event, trigger_tags, is_active } = req.body;
    await pool.query(
      'UPDATE drip_campaigns SET name=?,steps=?,trigger_event=?,trigger_tags=?,is_active=? WHERE id=? AND business_id=?',
      [name, JSON.stringify(steps||[]), trigger_event||'manual', JSON.stringify(trigger_tags||[]), is_active!==undefined?is_active:1, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM drip_campaigns WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteDrip = async (req, res) => {
  try {
    await pool.query('DELETE FROM drip_campaigns WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const enrollContacts = async (req, res) => {
  try {
    const { contact_ids, tags } = req.body;
    const [camp] = await pool.query('SELECT * FROM drip_campaigns WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!camp.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const steps = camp[0].steps || [];
    const firstDelay = steps.length > 0 ? (steps[0].delay_hours || 0) : 0;
    const nextSend = new Date(Date.now() + firstDelay * 3600000);

    let contacts = [];
    if (contact_ids?.length) {
      const [rows] = await pool.query('SELECT id FROM contacts WHERE id IN (?) AND business_id=?', [contact_ids, req.user.businessId]);
      contacts.push(...rows);
    }
    if (tags?.length) {
      const [all] = await pool.query('SELECT id, tags FROM contacts WHERE business_id=? AND opted_in=1', [req.user.businessId]);
      const filtered = all.filter(c => (c.tags||[]).some(t => tags.includes(t)));
      contacts.push(...filtered);
    }

    let enrolled = 0;
    for (const c of contacts) {
      const [existing] = await pool.query("SELECT id FROM drip_enrollments WHERE campaign_id=? AND contact_id=? AND status='active'", [req.params.id, c.id]);
      if (existing.length) continue;
      await pool.query('INSERT INTO drip_enrollments (campaign_id, contact_id, next_send_at) VALUES (?, ?, ?)', [req.params.id, c.id, nextSend]);
      enrolled++;
    }
    res.json({ success: true, data: { enrolled }, message: `${enrolled} contacts enrolled` });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getDripStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM drip_enrollments WHERE campaign_id=?', [req.params.id]);
    const [[{ active }]] = await pool.query("SELECT COUNT(*) as active FROM drip_enrollments WHERE campaign_id=? AND status='active'", [req.params.id]);
    const [[{ completed }]] = await pool.query("SELECT COUNT(*) as completed FROM drip_enrollments WHERE campaign_id=? AND status='completed'", [req.params.id]);
    const [[{ stopped }]] = await pool.query("SELECT COUNT(*) as stopped FROM drip_enrollments WHERE campaign_id=? AND status='stopped'", [req.params.id]);
    res.json({ success: true, data: { total, active, completed, stopped }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getDrip, createDrip, updateDrip, deleteDrip, enrollContacts, getDripStats };
