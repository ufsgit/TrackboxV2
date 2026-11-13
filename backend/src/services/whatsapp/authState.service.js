const pool = require('../../db/pool');
const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');

/**
 * Custom MySQL Auth State implementation for Baileys.
 * Stores auth credentials and keys safely into the MySQL whatsapp_qr_sessions table.
 */
async function useMySQLAuthState(sessionId) {
  // Load existing session record
  const [rows] = await pool.query(
    'SELECT creds_json FROM whatsapp_qr_sessions WHERE session_id = ?',
    [sessionId]
  );

  let creds;
  let keys = {};

  if (rows.length > 0 && rows[0].creds_json) {
    try {
      const parsed = JSON.parse(rows[0].creds_json, BufferJSON.reviver);
      creds = parsed.creds || initAuthCreds();
      keys = parsed.keys || {};
    } catch (e) {
      console.warn(`[WhatsApp AuthState] Failed to parse existing creds for session ${sessionId}, initializing new:`, e.message);
      creds = initAuthCreds();
      keys = {};
    }
  } else {
    creds = initAuthCreds();
    keys = {};
  }

  const saveState = async () => {
    try {
      const serialized = JSON.stringify({ creds, keys }, BufferJSON.replacer);
      await pool.query(
        `INSERT INTO whatsapp_qr_sessions (session_id, creds_json, status, is_active)
         VALUES (?, ?, 'pending', 1)
         ON DUPLICATE KEY UPDATE creds_json = VALUES(creds_json), updated_at = NOW()`,
        [sessionId, serialized]
      );
    } catch (err) {
      console.error('[WhatsApp AuthState] Error saving auth state to MySQL:', err);
    }
  };

  return {
    state: {
      creds,
      keys: {
        get: (type, ids) => {
          const data = {};
          for (const id of ids) {
            let value = keys[`${type}-${id}`];
            if (value) {
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }
          }
          return data;
        },
        set: (data) => {
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                keys[key] = value;
              } else {
                delete keys[key];
              }
            }
          }
          saveState();
        }
      }
    },
    saveCreds: saveState
  };
}

module.exports = {
  useMySQLAuthState
};

