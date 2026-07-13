const pool = require('../db/pool');
const crypto = require('crypto');
const { generateQRCode } = require('../utils/qrcode');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

const getLinks = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM ctwa_links WHERE business_id=?', [req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM ctwa_links WHERE business_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.businessId, lim, offset]);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createLink = async (req, res) => {
  try {
    const { name, phone, pre_filled_message, utm_source, utm_medium, utm_campaign } = req.body;
    const shortCode = crypto.randomBytes(4).toString('hex');
    const waUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(pre_filled_message || '')}`;
    const qrPath = await generateQRCode(waUrl, `${shortCode}.png`);
    const [result] = await pool.query(
      'INSERT INTO ctwa_links (business_id, name, phone, pre_filled_message, utm_source, utm_medium, utm_campaign, short_code, qr_code_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, phone, pre_filled_message||'', utm_source||'', utm_medium||'', utm_campaign||'', shortCode, qrPath]
    );
    const [rows] = await pool.query('SELECT * FROM ctwa_links WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: { ...rows[0], shortLink: `${process.env.BASE_URL}/c/${shortCode}` }, message: 'Link created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const redirect = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ctwa_links WHERE short_code=?', [req.params.shortCode]);
    if (!rows.length) return res.status(404).send('Link not found');
    const link = rows[0];
    await pool.query('UPDATE ctwa_links SET click_count=click_count+1 WHERE id=?', [link.id]);
    await pool.query(
      'INSERT INTO ctwa_clicks (link_id, ip_address, user_agent, referrer) VALUES (?, ?, ?, ?)',
      [link.id, req.ip, req.headers['user-agent']||'', req.headers['referer']||'']
    );
    const waUrl = `https://wa.me/${link.phone.replace(/\D/g,'')}?text=${encodeURIComponent(link.pre_filled_message||'')}`;
    res.redirect(waUrl);
  } catch (err) { res.status(500).send('Error'); }
};

const getLinkAnalytics = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ctwa_links WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const [clicks] = await pool.query(
      'SELECT DATE(clicked_at) as date, COUNT(*) as count FROM ctwa_clicks WHERE link_id=? GROUP BY DATE(clicked_at) ORDER BY date ASC',
      [req.params.id]
    );
    res.json({ success: true, data: { link: rows[0], clicksOverTime: clicks }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteLink = async (req, res) => {
  try {
    await pool.query('DELETE FROM ctwa_links WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getLinks, createLink, redirect, getLinkAnalytics, deleteLink };
