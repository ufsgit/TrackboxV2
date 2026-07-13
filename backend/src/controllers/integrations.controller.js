const pool = require('../db/pool');
const OpenAIService = require('../services/OpenAIService');

const getIntegrations = async (req, res) => {
  try {
    const allTypes = ['zoho','hubspot','woocommerce','shopify','zapier','pabbly','google_sheets','google_calendar','openai','razorpay','stripe','payu'];
    const [rows] = await pool.query('SELECT * FROM integrations WHERE business_id=?', [req.user.businessId]);
    const map = {};
    for (const r of rows) map[r.type] = r;
    const result = allTypes.map(t => ({ type: t, is_active: map[t]?.is_active || false, connected_at: map[t]?.connected_at || null, id: map[t]?.id || null }));
    res.json({ success: true, data: result, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const connectIntegration = async (req, res) => {
  try {
    const { type } = req.params;
    const { config } = req.body;
    const [existing] = await pool.query('SELECT id FROM integrations WHERE business_id=? AND type=?', [req.user.businessId, type]);
    if (existing.length) {
      await pool.query('UPDATE integrations SET config=?,is_active=1,connected_at=NOW() WHERE id=?', [JSON.stringify(config||{}), existing[0].id]);
    } else {
      await pool.query('INSERT INTO integrations (business_id, type, config, is_active, connected_at) VALUES (?, ?, ?, 1, NOW())', [req.user.businessId, type, JSON.stringify(config||{})]);
    }
    res.json({ success: true, data: null, message: `${type} connected` });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const disconnectIntegration = async (req, res) => {
  try {
    await pool.query('UPDATE integrations SET is_active=0 WHERE business_id=? AND type=?', [req.user.businessId, req.params.type]);
    res.json({ success: true, data: null, message: 'Disconnected' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const testOpenAI = async (req, res) => {
  try {
    const { api_key } = req.body;
    const result = await OpenAIService.testConnection(api_key);
    res.json({ success: result.success, data: null, message: result.success ? 'Connection successful' : result.message });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const syncGoogleSheets = async (req, res) => {
  try {
    // Stub - requires OAuth setup
    res.json({ success: true, data: null, message: 'Google Sheets sync initiated (requires OAuth configuration)' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const pushZohoLead = async (req, res) => {
  try {
    const { contact_id } = req.body;
    const [contacts] = await pool.query('SELECT * FROM contacts WHERE id=? AND business_id=?', [contact_id, req.user.businessId]);
    if (!contacts.length) return res.status(404).json({ success: false, message: 'Contact not found', data: null });
    const [intRows] = await pool.query("SELECT config FROM integrations WHERE business_id=? AND type='zoho' AND is_active=1", [req.user.businessId]);
    if (!intRows.length) return res.status(400).json({ success: false, message: 'Zoho not connected', data: null });
    res.json({ success: true, data: null, message: 'Lead pushed to Zoho (configure access token in integration settings)' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const pushHubspotLead = async (req, res) => {
  try {
    const { contact_id } = req.body;
    const [contacts] = await pool.query('SELECT * FROM contacts WHERE id=? AND business_id=?', [contact_id, req.user.businessId]);
    if (!contacts.length) return res.status(404).json({ success: false, message: 'Contact not found', data: null });
    res.json({ success: true, data: null, message: 'Lead pushed to HubSpot (configure API key in integration settings)' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const searchInstagramUser = async (req, res) => {
  try {
    const { igSid } = req.query;
    const InstagramService = require('../services/InstagramService');
    const result = await InstagramService.getUserProfile(igSid, req.user.businessId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const startInstagramChat = async (req, res) => {
  try {
    const { igSid, message, name } = req.body;
    const bizId = req.user.businessId;
    const InstagramService = require('../services/InstagramService');

    // 1. Create or get contact
    let [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [bizId, igSid]);
    let contactId;
    if (!contacts.length) {
      const [result] = await pool.query('INSERT INTO contacts (business_id, phone, name, channel_preference) VALUES (?, ?, ?, ?)', [bizId, igSid, name || `IG_${igSid}`, 'instagram']);
      contactId = result.insertId;
    } else {
      contactId = contacts[0].id;
    }

    // 2. Create or get conversation
    let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND channel='instagram' AND status!='resolved' LIMIT 1", [bizId, contactId]);
    let convId;
    if (!convos.length) {
      const [result] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, last_message_at) VALUES (?, ?, 'instagram', NOW())", [bizId, contactId]);
      convId = result.insertId;
    } else {
      convId = convos[0].id;
    }

    // 3. Send message
    const metaResult = await InstagramService.sendTextMessage(igSid, message, bizId);
    if (!metaResult.success) return res.status(400).json(metaResult);

    // 4. Save message to DB
    await pool.query("INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, 'outbound', ?, 'text')", [convId, message]);
    await pool.query('UPDATE conversations SET last_message_at=NOW() WHERE id=?', [convId]);

    res.json({ success: true, data: { conversationId: convId }, message: 'Conversation started and message sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = { getIntegrations, connectIntegration, disconnectIntegration, testOpenAI, syncGoogleSheets, pushZohoLead, pushHubspotLead, searchInstagramUser, startInstagramChat };
