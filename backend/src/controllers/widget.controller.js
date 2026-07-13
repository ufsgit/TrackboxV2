const pool = require('../db/pool');
const crypto = require('crypto');
const { processChatbotFlow } = require('./chatbots.controller');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

const getWidgets = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM website_widgets WHERE business_id=? ORDER BY created_at DESC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createWidget = async (req, res) => {
  try {
    const { chatbot_id, widget_name, welcome_message, brand_color, position, allowed_domains } = req.body;
    const widgetToken = crypto.randomBytes(16).toString('hex');
    const [result] = await pool.query(
      'INSERT INTO website_widgets (business_id, chatbot_id, widget_name, welcome_message, brand_color, position, allowed_domains, widget_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, chatbot_id||null, widget_name, welcome_message||'Hi! How can we help you?', brand_color||'#25D366', position||'bottom-right', allowed_domains||'', widgetToken]
    );
    const [rows] = await pool.query('SELECT * FROM website_widgets WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Widget created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateWidget = async (req, res) => {
  try {
    const { widget_name, welcome_message, brand_color, position, allowed_domains, is_active } = req.body;
    await pool.query(
      'UPDATE website_widgets SET widget_name=?,welcome_message=?,brand_color=?,position=?,allowed_domains=?,is_active=? WHERE id=? AND business_id=?',
      [widget_name, welcome_message||'', brand_color||'#25D366', position||'bottom-right', allowed_domains||'', is_active!==undefined?is_active:1, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM website_widgets WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteWidget = async (req, res) => {
  try {
    await pool.query('DELETE FROM website_widgets WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getWidgetConfig = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM website_widgets WHERE widget_token=? AND is_active=1', [req.params.token]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Widget not found', data: null });
    const w = rows[0];
    res.json({ success: true, data: { widgetName: w.widget_name, welcomeMessage: w.welcome_message, brandColor: w.brand_color, position: w.position }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getEmbedJs = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM website_widgets WHERE widget_token=? AND is_active=1', [req.params.token]);
    if (!rows.length) return res.status(404).send('// Widget not found');
    const w = rows[0];
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const js = `
(function() {
  function initWidget() {
    var token = '${w.widget_token}';
    var color = '${w.brand_color}';
    var position = '${w.position}';
    var baseUrl = '${baseUrl}';
    var style = document.createElement('style');
    style.innerHTML = '.uc-widget-btn{position:fixed;${w.position==='bottom-right'?'right:20px':'left:20px'};bottom:20px;width:60px;height:60px;border-radius:50%;background:'+color+';border:none;cursor:pointer;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;} .uc-widget-panel{position:fixed;${w.position==='bottom-right'?'right:20px':'left:20px'};bottom:90px;width:350px;height:500px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.2);z-index:9998;display:none;flex-direction:column;overflow:hidden;} .uc-panel-header{background:'+color+';padding:16px;color:#fff;font-family:sans-serif;} .uc-messages{flex:1;overflow-y:auto;padding:16px;background:#f5f5f5;} .uc-input-area{padding:12px;border-top:1px solid #eee;display:flex;gap:8px;} .uc-input{flex:1;border:1px solid #ddd;border-radius:20px;padding:8px 16px;outline:none;} .uc-send-btn{background:'+color+';color:#fff;border:none;border-radius:50%;width:36px;height:36px;cursor:pointer;} .uc-msg{margin:4px 0;padding:8px 12px;border-radius:12px;max-width:80%;font-size:14px;font-family:sans-serif;} .uc-msg.bot{background:#fff;align-self:flex-start;} .uc-msg.user{background:'+color+';color:#fff;align-self:flex-end;margin-left:auto;}';
    document.head.appendChild(style);
    var btn = document.createElement('button');
    btn.className='uc-widget-btn';
    btn.innerHTML='<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
    var panel = document.createElement('div');
    panel.className='uc-widget-panel';
    panel.innerHTML='<div class="uc-panel-header"><strong>${w.widget_name}</strong><br><small>${w.welcome_message}</small></div><div class="uc-messages" id="uc-msgs"></div><div class="uc-input-area"><input class="uc-input" id="uc-inp" placeholder="Type a message..."/><button class="uc-send-btn" id="uc-send">&#10148;</button></div>';
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    var open=false;
    btn.onclick=function(){open=!open;panel.style.display=open?'flex':'none';};
    function addMsg(text,type){var m=document.createElement('div');m.className='uc-msg '+type;m.textContent=text;document.getElementById('uc-msgs').appendChild(m);}
    document.getElementById('uc-send').onclick=function(){
      var inp=document.getElementById('uc-inp');
      var msg=inp.value.trim();if(!msg)return;
      addMsg(msg,'user');inp.value='';
      fetch(baseUrl+'/api/widget/'+token+'/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})})
      .then(r=>r.json()).then(d=>{if(d.data&&d.data.response)addMsg(d.data.response,'bot');});
    };
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initWidget); } else { initWidget(); }
})();`;
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(js);
  } catch (err) { res.status(500).send('// Error'); }
};

const handleWidgetMessage = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM website_widgets WHERE widget_token=? AND is_active=1', [req.params.token]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Widget not found', data: null });
    const widget = rows[0];
    if (!widget.chatbot_id) return res.json({ success: true, data: { response: 'Thank you for your message!' }, message: 'OK' });
    const [chatbots] = await pool.query('SELECT * FROM chatbots WHERE id=?', [widget.chatbot_id]);
    if (!chatbots.length) return res.json({ success: true, data: { response: 'Service unavailable.' }, message: 'OK' });
    
    // Find or create a contact based on IP to maintain session
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const phoneName = `Widget_${ip}`;
    let [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND name=?', [widget.business_id, phoneName]);
    let contactId;
    if (!contacts.length) {
      const [result] = await pool.query('INSERT INTO contacts (business_id, phone, name) VALUES (?, ?, ?)', [widget.business_id, phoneName, phoneName]);
      contactId = result.insertId;
    } else {
      contactId = contacts[0].id;
    }

    const result = await processChatbotFlow(chatbots[0], contactId, req.body.message, widget.business_id);
    
    // Create or find Conversation for Shared Inbox
    let [convs] = await pool.query('SELECT * FROM conversations WHERE contact_id=? AND business_id=? AND status="open"', [contactId, widget.business_id]);
    let convId;
    if (!convs.length) {
      const [resConv] = await pool.query('INSERT INTO conversations (business_id, contact_id, channel) VALUES (?, ?, ?)', [widget.business_id, contactId, 'website']);
      convId = resConv.insertId;
    } else { convId = convs[0].id; }

    // Save inbound user message
    const [inboundMsg] = await pool.query('INSERT INTO messages (conversation_id, direction, content) VALUES (?, ?, ?)', [convId, 'inbound', req.body.message]);
    await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [convId]);

    // Emit socket for inbound message
    if (req.app.get('io')) {
      const [msg] = await pool.query('SELECT * FROM messages WHERE id = ?', [inboundMsg.insertId]);
      req.app.get('io').to(`biz_${widget.business_id}`).emit('new_message', { conversationId: convId, message: msg[0] });
    }

    // Save outbound bot message if applicable
    if (result && result.response) {
      const [outboundMsg] = await pool.query('INSERT INTO messages (conversation_id, direction, content) VALUES (?, ?, ?)', [convId, 'outbound', result.response]);
      await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [convId]);
      
      // Emit socket for outbound message
      if (req.app.get('io')) {
        const [msg2] = await pool.query('SELECT * FROM messages WHERE id = ?', [outboundMsg.insertId]);
        req.app.get('io').to(`biz_${widget.business_id}`).emit('new_message', { conversationId: convId, message: msg2[0] });
      }
    }

    res.json({ success: true, data: result, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getWidgets, createWidget, updateWidget, deleteWidget, getWidgetConfig, getEmbedJs, handleWidgetMessage };
