const pool = require('../db/pool');
const crypto = require('crypto');

const joinAffiliate = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id FROM affiliates WHERE user_id=?', [req.user.userId]);
    if (existing.length) return res.json({ success: true, data: existing[0], message: 'Already an affiliate' });
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const [result] = await pool.query('INSERT INTO affiliates (user_id, referral_code) VALUES (?, ?)', [req.user.userId, code]);
    const [rows] = await pool.query('SELECT * FROM affiliates WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Joined affiliate program' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getDashboard = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM affiliates WHERE user_id=?', [req.user.userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not an affiliate', data: null });
    const aff = rows[0];
    const referralLink = `${process.env.BASE_URL}/api/auth/register?ref=${aff.referral_code}`;
    res.json({ success: true, data: { ...aff, referralLink }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getReferrals = async (req, res) => {
  try {
    const [aff] = await pool.query('SELECT id FROM affiliates WHERE user_id=?', [req.user.userId]);
    if (!aff.length) return res.status(404).json({ success: false, message: 'Not an affiliate', data: null });
    const [rows] = await pool.query(
      'SELECT ar.*, b.name as business_name, b.plan FROM affiliate_referrals ar JOIN businesses b ON ar.referred_business_id=b.id WHERE ar.affiliate_id=? ORDER BY ar.created_at DESC',
      [aff[0].id]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { joinAffiliate, getDashboard, getReferrals };
