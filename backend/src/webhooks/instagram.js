const pool = require('../db/pool');
const { processChatbotFlow } = require('../controllers/chatbots.controller');
const { normalizePhone } = require('../utils/phoneHelper');

async function handleInstagramWebhook(req, res, io) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  try {
    const body = req.body;
    console.log('📬 FULL WEBHOOK BODY:', JSON.stringify(body, null, 2));
    const entries = body.entry || [];
    for (const entry of entries) {
      let entryId = entry.id;
      console.log('🔍 Processing entry for ID:', entryId);
      
      // If it's a test event (ID '0'), default to the first business for debugging
      let queryId = entryId;
      if (entryId === '0' || entryId === 0) {
        console.log('🧪 Test event detected, targeting Business ID 1');
        queryId = '1139806642546903'; // Use your Page ID here
      }

      // Find business and social account by platform and ID
      let [accounts] = await pool.query(
        'SELECT * FROM social_accounts WHERE platform="instagram" AND (account_id=? OR app_id=?) AND is_active=1', 
        [queryId, queryId]
      );
      let bizId, socialAccountId = null;
      let igAccountId, fbPageId;
      if (accounts.length) {
        bizId = accounts[0].business_id;
        socialAccountId = accounts[0].id;
        igAccountId = accounts[0].account_id;
        fbPageId = accounts[0].app_id;
      } else {
        const [businesses] = await pool.query(
          'SELECT id, ig_account_id, fb_page_id FROM businesses WHERE ig_account_id=? OR fb_page_id=?', 
          [queryId, queryId]
        );
        if (!businesses.length) {
          console.log('⚠️ No business found for ID:', entryId);
          continue;
        }
        bizId = businesses[0].id;
        igAccountId = businesses[0].ig_account_id;
        fbPageId = businesses[0].fb_page_id;
      }

      // Handle both 'messaging' (standard) and 'changes' (webhook) formats
      const messaging = entry.messaging || [];
      const changes = entry.changes || [];
      const events = [...messaging];

      for (const change of changes) {
        if (change.field === 'messages') {
          events.push(change.value);
        }
      }

      for (const event of events) {
        try {
          // 1. Identify Sender and Text
          let senderId = event.sender?.id || event.from?.id || event.value?.from?.id || event.value?.sender?.id;
          let text = event.message?.text || event.text || event.value?.message?.text || event.value?.text || '';
          const mid = event.message?.mid || event.message_edit?.mid || event.value?.message?.mid;

          // ULTIMATE FALLBACK: Fetch manually if text/sender is missing
          if ((!text || !senderId) && mid) {
            let igToken = null;
            if (socialAccountId) {
              const [acc] = await pool.query('SELECT token FROM social_accounts WHERE id = ?', [socialAccountId]);
              if (acc.length) igToken = acc[0].token;
            }
            if (!igToken) {
              const [biz] = await pool.query('SELECT ig_token FROM businesses WHERE id = ?', [bizId]);
              if (biz.length) igToken = biz[0].ig_token;
            }
            if (igToken) {
              try {
                const axios = require('axios');
                const response = await axios.get(`https://graph.facebook.com/v18.0/${mid}?fields=message,from,to&access_token=${igToken}`);
                if (response.data) {
                  text = response.data.message || text;
                  senderId = response.data.from?.id || senderId;
                  // If we fetched data, let's also grab the recipient to ensure we map to the right chat
                  if (response.data.to?.data && response.data.to.data.length > 0) {
                    const fetchedRecipientId = response.data.to.data[0].id;
                    // If the business sent it, the customer is the recipient
                    if (senderId === igAccountId || senderId === fbPageId) {
                      event.recipient = { id: fetchedRecipientId };
                    }
                  }
                }
              } catch (fetchErr) {
                // Silently fail
              }
            }
          }

          if (!senderId || !text) continue;

          // DUPLICATE CHECK: Skip if this mid was already saved
          if (mid) {
            const [existing] = await pool.query('SELECT id FROM messages WHERE wa_message_id = ?', [mid]);
            if (existing.length) continue; // Already saved, skip
          }

          // 2. Determine Direction
          const direction = (senderId === igAccountId || senderId === fbPageId) ? 'outbound' : 'inbound';
          const customerId = direction === 'inbound' ? senderId : (event.recipient?.id || entryId);

          if (!customerId) continue;

          // 3. Process database updates
          // Get or create contact
          const normalizedCustomerId = normalizePhone(customerId);
          let [contacts] = await pool.query('SELECT id FROM contacts WHERE business_id=? AND phone=?', [bizId, normalizedCustomerId]);
          let contactId;
          if (!contacts.length) {
            const [result] = await pool.query("INSERT INTO contacts (business_id, phone, name, tags) VALUES (?, ?, ?, '[\"lead\"]') ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)", [bizId, normalizedCustomerId, `IG_${normalizedCustomerId}`]);
            contactId = result.insertId;
          } else {
            contactId = contacts[0].id;
          }

          // Get or create conversation (reopen resolved ones to avoid duplicates)
          let [convos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND channel='instagram' AND status!='resolved' LIMIT 1", [bizId, contactId]);
          let convId;
          if (!convos.length) {
            // Try to reopen the most recent resolved conversation
            let [resolvedConvos] = await pool.query("SELECT id FROM conversations WHERE business_id=? AND contact_id=? AND channel='instagram' AND status='resolved' ORDER BY last_message_at DESC LIMIT 1", [bizId, contactId]);
            if (resolvedConvos.length) {
              convId = resolvedConvos[0].id;
              await pool.query("UPDATE conversations SET status='open', last_message_at=NOW(), social_account_id=COALESCE(social_account_id, ?) WHERE id=?", [socialAccountId, convId]);
            } else {
              const [result] = await pool.query("INSERT INTO conversations (business_id, contact_id, channel, status, last_message_at, social_account_id) VALUES (?, ?, 'instagram', 'open', NOW(), ?)", [bizId, contactId, socialAccountId]);
              convId = result.insertId;
            }
          } else {
            convId = convos[0].id;
            await pool.query('UPDATE conversations SET last_message_at=NOW(), social_account_id=COALESCE(social_account_id, ?) WHERE id=?', [socialAccountId, convId]);
          }
          
          // Save message
          await pool.query(
            "INSERT INTO messages (conversation_id, direction, content, message_type, wa_message_id) VALUES (?, ?, ?, 'text', ?)", 
            [convId, direction, text, mid]
          );
          
          if (io) {
            const [fullMsg] = await pool.query('SELECT * FROM messages WHERE wa_message_id = ?', [mid]);
            console.log('🔌 Emitting real-time update with message details');
            io.to(`biz_${bizId}`).emit('new_message', { 
              conversationId: convId, 
              channel: 'instagram',
              message: fullMsg[0] 
            });
            io.to(`biz_${bizId}`).emit('conversation_update', { bizId });
          }

          // 4. Auto-reply via chatbot
          const [convDetails] = await pool.query('SELECT assigned_to FROM conversations WHERE id=?', [convId]);
          const isAssigned = convDetails.length && convDetails[0].assigned_to;
          
          if (!isAssigned) {
            const [sessionRows] = await pool.query('SELECT * FROM chatbot_sessions WHERE contact_id=? ORDER BY started_at DESC LIMIT 1', [contactId]);
            let session = sessionRows[0] || null;
            
            const [bots] = await pool.query("SELECT * FROM chatbots WHERE business_id=? AND is_active=1 AND channel='instagram'", [bizId]);
            let botTriggered = false;

            for (const bot of bots) {
              const keywords = bot.trigger_keywords || [];
              const isSessionActive = session && session.chatbot_id === bot.id;
              const isKeywordMatch = keywords.some(k => {
                if (k === '*') return true;
                const escapedK = k.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(`(?:^|\\W)${escapedK}(?:$|\\W)`, 'i').test(text);
              });

              // If keyword matched and session is active, reset session to start fresh
              if (isKeywordMatch && isSessionActive) {
                await pool.query('DELETE FROM chatbot_sessions WHERE id=?', [session.id]);
                session = null;
              }
              
              if (isSessionActive || isKeywordMatch) {
                const result = await processChatbotFlow(bot, contactId, text, { businessId: bizId, socialAccountId });
                console.log('[Instagram Bot] Flow result:', JSON.stringify(result));
                await sendInstagramBotReply(senderId, result, bizId, convId, socialAccountId);
                botTriggered = true;
                break; 
              }
            }

            // Fallback for welcome bot
            if (!botTriggered) {
              const welcomeBot = bots.find(b => b.is_welcome);
              if (welcomeBot) {
                const result = await processChatbotFlow(welcomeBot, contactId, text, { businessId: bizId, socialAccountId });
                await sendInstagramBotReply(senderId, result, bizId, convId, socialAccountId);
              }
            }
          }
        } catch (eventError) {
          console.error('❌ Instagram event error:', eventError);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Instagram webhook error:', err);
    res.sendStatus(200);
  }
}

async function sendInstagramBotReply(recipientId, flowResult, businessId, conversationId, socialAccountId = null) {
  const InstagramService = require('../services/InstagramService');
  const { response, interactive } = flowResult;
  if (!response) return;

  try {
    let finalMessage = response;
    // Instagram doesn't support the same 'button' payload as WhatsApp.
    // We convert buttons into a text list for the user to pick by number.
    if (interactive && interactive.action?.buttons) {
      finalMessage += '\n\n';
      interactive.action.buttons.forEach((btn, i) => {
        finalMessage += `${i + 1}. ${btn.reply.title}\n`;
      });
    }

    const res = await InstagramService.sendTextMessage(recipientId, finalMessage, { businessId, socialAccountId });
    if (res.success) {
      await pool.query(
        'INSERT INTO messages (conversation_id, direction, content, message_type) VALUES (?, ?, ?, ?)',
        [conversationId, 'outbound', finalMessage, 'text']
      );
    }
  } catch (err) {
    console.error('[Instagram Bot] Send failed:', err.message);
  }
}

module.exports = { handleInstagramWebhook };
