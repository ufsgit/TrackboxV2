const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { signToken } = require('../utils/jwtHelper');

const register = async (req, res) => {
  try {
    const { businessName, whatsappNumber, name, email, password, referralCode } = req.body;
    if (!businessName || !email || !password || !name)
      return res.status(400).json({ success: false, message: 'Missing required fields', data: null });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered', data: null });

    const [bizResult] = await pool.query(
      'INSERT INTO businesses (name, whatsapp_number) VALUES (?, ?)',
      [businessName, whatsappNumber || '']
    );
    const businessId = bizResult.insertId;

    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await pool.query(
      'INSERT INTO users (business_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [businessId, name, email, hash, 'admin']
    );

    // Handle referral
    if (referralCode) {
      const [aff] = await pool.query('SELECT id FROM affiliates WHERE referral_code = ?', [referralCode]);
      if (aff.length > 0) {
        await pool.query(
          'INSERT INTO affiliate_referrals (affiliate_id, referred_business_id, commission, status) VALUES (?, ?, ?, ?)',
          [aff[0].id, businessId, 500, 'pending']
        );
        await pool.query('UPDATE affiliates SET total_referrals = total_referrals + 1 WHERE id = ?', [aff[0].id]);
      }
    }

    const token = signToken({ userId: userResult.insertId, businessId, role: 'admin', name, email });
    res.status(201).json({ success: true, data: { token, role: 'admin', businessId, name }, message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required', data: null });

    const [rows] = await pool.query(
      'SELECT u.*, b.name as businessName FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.email = ? AND u.is_active = 1',
      [email]
    );
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });

    const token = signToken({ userId: user.id, businessId: user.business_id, role: user.role, name: user.name, email: user.email });
    res.json({
      success: true,
      data: { id: user.id, token, role: user.role, businessId: user.business_id, name: user.name, email: user.email, businessName: user.businessName },
      message: 'Login successful'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const refresh = async (req, res) => {
  try {
    const { token: oldToken } = req.body;
    if (!oldToken) return res.status(400).json({ success: false, message: 'Token required', data: null });
    const { signToken: sign, verifyToken } = require('../utils/jwtHelper');
    const payload = verifyToken(oldToken);
    const newToken = signToken({ userId: payload.userId, businessId: payload.businessId, role: payload.role, name: payload.name, email: payload.email });
    res.json({ success: true, data: { token: newToken }, message: 'Token refreshed' });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token', data: null });
  }
};

const me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT u.id, u.name, u.email, u.role, u.business_id, u.created_at, b.name as businessName, b.plan FROM users u JOIN businesses b ON u.business_id = b.id WHERE u.id = ?',
      [req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found', data: null });
    res.json({ success: true, data: rows[0], message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = { register, login, refresh, me };
