const pool = require('../db/pool');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

const getFlows = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ivr_flows WHERE business_id=? ORDER BY created_at DESC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createFlow = async (req, res) => {
  try {
    const { name, did_number, welcome_audio_url, menu, fallback_number } = req.body;
    const [result] = await pool.query(
      'INSERT INTO ivr_flows (business_id, name, did_number, welcome_audio_url, menu, fallback_number) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, did_number||'', welcome_audio_url||null, JSON.stringify(menu||[]), fallback_number||null]
    );
    const [rows] = await pool.query('SELECT * FROM ivr_flows WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'IVR flow created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateFlow = async (req, res) => {
  try {
    const { name, did_number, welcome_audio_url, menu, fallback_number, is_active } = req.body;
    await pool.query(
      'UPDATE ivr_flows SET name=?,did_number=?,welcome_audio_url=?,menu=?,fallback_number=?,is_active=? WHERE id=? AND business_id=?',
      [name, did_number||'', welcome_audio_url||null, JSON.stringify(menu||[]), fallback_number||null, is_active!==undefined?is_active:1, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM ivr_flows WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteFlow = async (req, res) => {
  try {
    await pool.query('DELETE FROM ivr_flows WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getCallLogs = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM ivr_call_logs WHERE flow_id=?', [req.params.id]);
    const [rows] = await pool.query('SELECT * FROM ivr_call_logs WHERE flow_id=? ORDER BY called_at DESC LIMIT ? OFFSET ?', [req.params.id, lim, offset]);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const handleIncomingCall = async (req, res) => {
  try {
    const { did_number, caller } = req.body;
    const [flows] = await pool.query('SELECT * FROM ivr_flows WHERE did_number=? AND is_active=1 LIMIT 1', [did_number]);
    if (!flows.length) return res.send('<?xml version="1.0"?><Response><Say>Sorry, this number is not configured.</Say></Response>');
    const flow = flows[0];
    const menu = flow.menu || [];
    let menuText = menu.map(m => `Press ${m.key} for ${m.label}`).join('. ');
    res.setHeader('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0"?><Response><Say>${flow.welcome_audio_url || `Welcome. ${menuText}`}</Say><Gather numDigits="1" action="/api/webhooks/ivr/keypress" method="POST"><Say>${menuText}</Say></Gather></Response>`);
  } catch (err) { res.status(500).send('Error'); }
};

const handleKeyPress = async (req, res) => {
  try {
    const { Digits, From, CallDuration, did_number } = req.body;
    const [flows] = await pool.query('SELECT * FROM ivr_flows WHERE did_number=? AND is_active=1 LIMIT 1', [did_number || '']);
    if (flows.length) {
      await pool.query(
        "INSERT INTO ivr_call_logs (flow_id, caller_number, key_pressed, call_duration, status) VALUES (?, ?, ?, ?, 'answered')",
        [flows[0].id, From, Digits, CallDuration || 0]
      );
      const menu = flows[0].menu || [];
      const item = menu.find(m => m.key === Digits);
      if (item) {
        res.setHeader('Content-Type', 'text/xml');
        if (item.action === 'play') return res.send(`<?xml version="1.0"?><Response><Say>${item.value}</Say></Response>`);
        if (item.action === 'forward') return res.send(`<?xml version="1.0"?><Response><Dial>${item.value}</Dial></Response>`);
      }
    }
    res.setHeader('Content-Type', 'text/xml');
    res.send('<?xml version="1.0"?><Response><Say>Invalid selection. Goodbye.</Say></Response>');
  } catch (err) { res.status(500).send('Error'); }
};

module.exports = { getFlows, createFlow, updateFlow, deleteFlow, getCallLogs, handleIncomingCall, handleKeyPress };
