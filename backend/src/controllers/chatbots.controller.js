const pool = require('../db/pool');
const OpenAIService = require('../services/OpenAIService');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

const getChatbots = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM chatbots WHERE business_id=?', [req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM chatbots WHERE business_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.businessId, lim, offset]);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createChatbot = async (req, res) => {
  try {
    const { name, trigger_keywords, flow, ai_enabled, openai_system_prompt, channel } = req.body;
    const [result] = await pool.query(
      'INSERT INTO chatbots (business_id, name, trigger_keywords, flow, ai_enabled, openai_system_prompt, channel) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, JSON.stringify(trigger_keywords||[]), JSON.stringify(flow||{nodes:[],edges:[]}), ai_enabled||0, openai_system_prompt||null, channel||'whatsapp']
    );
    const [rows] = await pool.query('SELECT * FROM chatbots WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Chatbot created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateChatbot = async (req, res) => {
  try {
    const { name, trigger_keywords, flow, ai_enabled, openai_system_prompt, is_active, channel } = req.body;
    await pool.query(
      'UPDATE chatbots SET name=?,trigger_keywords=?,flow=?,ai_enabled=?,openai_system_prompt=?,is_active=?,channel=? WHERE id=? AND business_id=?',
      [name, JSON.stringify(trigger_keywords||[]), JSON.stringify(flow||{nodes:[],edges:[]}), ai_enabled||0, openai_system_prompt||null, is_active!==undefined?is_active:1, channel||'whatsapp', req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM chatbots WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteChatbot = async (req, res) => {
  try {
    await pool.query('DELETE FROM chatbots WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const testChatbot = async (req, res) => {
  try {
    const { message, contact_id } = req.body;
    const [rows] = await pool.query('SELECT * FROM chatbots WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const result = await processChatbotFlow(rows[0], contact_id || 0, message, req.user.businessId);
    res.json({ success: true, data: result, message: 'Test completed' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

async function processChatbotFlow(chatbot, contactId, inboundMessage, businessId) {
  const bizId = typeof businessId === 'object' && businessId !== null ? businessId.businessId : businessId;
  // Bug fix: flow from DB is a JSON string — always parse it
  let flowRaw = chatbot.flow || { nodes: [], edges: [] };
  const flow = typeof flowRaw === 'string' ? JSON.parse(flowRaw) : flowRaw;
  const nodes = flow.nodes || [];

  // Find or create session
  let [sessions] = await pool.query(
    'SELECT * FROM chatbot_sessions WHERE chatbot_id=? AND contact_id=? ORDER BY started_at DESC LIMIT 1',
    [chatbot.id, contactId]
  );
  let session = sessions[0];
  let currentNodeId = session?.current_node_id || (nodes[0]?.id);

  const currentNode = nodes.find(n => n.id === currentNodeId);

  // Bug fix: Only use AI when there are NO flow nodes at all, or the node is explicitly ai_response type
  // DO NOT run AI when there's an interactive/message node — that kills buttons!
  const hasFlowNodes = nodes.length > 0;
  const useAI = chatbot.ai_enabled && (!hasFlowNodes || !currentNode || currentNode.type === 'ai_response');

  if (!currentNode && !chatbot.ai_enabled) {
    return { response: 'Sorry, I could not process your request.' };
  }

  let response = '';
  let interactive = null;
  let nextNodeId = currentNode?.next;

  if (useAI) {
    // Fetch last 10 messages for context
    const [historyRows] = await pool.query(
      `SELECT m.content, m.direction 
       FROM messages m 
       JOIN conversations c ON m.conversation_id = c.id 
       WHERE c.contact_id = ? AND c.business_id = ? 
       ORDER BY m.sent_at DESC LIMIT 10`,
      [contactId, bizId]
    );
    
    const messages = historyRows.reverse().map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content
    }));
    
    if (!messages.length || messages[messages.length - 1].content !== inboundMessage) {
      messages.push({ role: 'user', content: inboundMessage });
    }

    const aiResult = await OpenAIService.chat(bizId, messages, chatbot.openai_system_prompt || 'You are a professional assistant.');
    if (aiResult.success) {
      response = aiResult.data;
    } else {
      // AI not configured — fall back to next node content or a polite message
      const nextNode = nodes.find(n => n.id === currentNode?.next);
      response = nextNode?.content || 'Thank you for your message. Our team will assist you shortly.';
      console.warn('[Chatbot] AI unavailable, falling back to next node or default message.');
    }
    return { response };
  }

  if (currentNode.type === 'message') {
    response = currentNode.content;
  } else if (currentNode.type === 'interactive') {
    const buttons = (currentNode.buttons || []).slice(0, 3);

    // Check if the user is REPLYING to this interactive node (by number or title)
    const msgTrimmed = inboundMessage.trim().toLowerCase();
    const selectedByNumber = parseInt(msgTrimmed) - 1; // "1" → index 0
    const selectedByTitle = buttons.findIndex(b => b.title?.toLowerCase() === msgTrimmed);
    const selectedByBtnId = buttons.findIndex(b => b.id === msgTrimmed);

    // Prefer ID match first, then auto-generated ID, then number, then title
    let selectedButton = null;
    const autoGenPrefix = `${currentNode.id}_btn_`.toLowerCase();
    
    if (selectedByBtnId >= 0) {
      selectedButton = buttons[selectedByBtnId];
    } else if (msgTrimmed.startsWith(autoGenPrefix)) {
      const btnIndexStr = msgTrimmed.replace(autoGenPrefix, '');
      const btnIndex = parseInt(btnIndexStr) - 1;
      if (!isNaN(btnIndex) && btnIndex >= 0 && btnIndex < buttons.length) {
        selectedButton = buttons[btnIndex];
      }
    } else if (!isNaN(selectedByNumber) && selectedByNumber >= 0 && selectedByNumber < buttons.length) {
      selectedButton = buttons[selectedByNumber];
    } else if (selectedByTitle >= 0) {
      selectedButton = buttons[selectedByTitle];
    }

    if (selectedButton) {
      // User selected a button — navigate to its linked next node
      nextNodeId = selectedButton.next || currentNode.next;
      const nextNode = nodes.find(n => n.id === nextNodeId);
      response = nextNode?.content || 'Thank you for your selection!';
      // If next node is also interactive, process it now
      if (nextNode?.type === 'interactive') {
        response = nextNode.content;
        const nextButtons = (nextNode.buttons || []).slice(0, 3);
        if (nextButtons.length > 0) {
          interactive = {
            type: 'button',
            body: { text: nextNode.content.trim() },
            action: {
                buttons: nextButtons.map((b, i) => ({
                  type: 'reply',
                  reply: {
                    // Unique ID encoding next node ID
                    id: `${nextNode.id}_btn_${i + 1}`,
                    title: String(b.title || `Option ${i + 1}`).trim().substring(0, 20)
                  }
                }))
            }
          };
        }
      }
    } else {
      // User hasn't replied yet — show the interactive node for the first time
      response = currentNode.content;
      if (buttons.length === 0) {
        console.warn('[Chatbot] Interactive node has no buttons, sending as text.');
      } else {
        interactive = {
          type: 'button',
          body: { text: (currentNode.content || 'Please choose an option:').trim() },
          action: {
            buttons: buttons.map((b, i) => ({
              type: 'reply',
              reply: {
                // Use a unique ID that encodes the node ID to avoid collisions across different interactive nodes
                id: `${currentNode.id}_btn_${i + 1}`,
                title: String(b.title || `Option ${i + 1}`).trim().substring(0, 20)
              }
            }))
          }
        };
        // Do NOT advance the session — wait for user to select
        nextNodeId = currentNode.id;
      }
    }
  } else if (currentNode.type === 'collect_input') {
    response = currentNode.content;
    nextNodeId = currentNode.next;
  } else if (currentNode.type === 'condition') {
    const rules = currentNode.rules || [];
    const matched = rules.find(r => inboundMessage.trim().toLowerCase() === r.match.toLowerCase());
    nextNodeId = matched ? matched.next : currentNode.default;
    const nextNode = nodes.find(n => n.id === nextNodeId);
    response = nextNode?.content || 'Processing...';
    // If next node is interactive, we should process it too, but for now just move to it
  } else if (currentNode.type === 'transfer') {
    response = currentNode.content || 'Transferring you to a human agent...';
    // Update conversation status to 'open' and clear session
    const [convos] = await pool.query("SELECT id FROM conversations WHERE contact_id=? AND business_id=? AND status!='resolved' LIMIT 1", [contactId, bizId]);
    if (convos.length) {
      await pool.query("UPDATE conversations SET status='open', assigned_to=NULL WHERE id=?", [convos[0].id]);
    }
    if (session) await pool.query('DELETE FROM chatbot_sessions WHERE id=?', [session.id]);
    return { response, transfer: true };
  } else if (currentNode.type === 'end') {
    response = currentNode.content || 'Thank you!';
    if (session) await pool.query('DELETE FROM chatbot_sessions WHERE id=?', [session.id]);
    return { response };
  }

  // Upsert session
  if (session) {
    await pool.query('UPDATE chatbot_sessions SET current_node_id=?, last_activity=NOW() WHERE id=?', [nextNodeId || currentNodeId, session.id]);
  } else {
    await pool.query(
      'INSERT INTO chatbot_sessions (chatbot_id, contact_id, current_node_id) VALUES (?, ?, ?)',
      [chatbot.id, contactId, nextNodeId || currentNodeId]
    );
  }
  return { response, interactive, currentNode: currentNodeId, nextNode: nextNodeId };
}


module.exports = { getChatbots, createChatbot, updateChatbot, deleteChatbot, testChatbot, processChatbotFlow };
