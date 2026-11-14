const pool = require('../../db/pool');
const { initAuthCreds, BufferJSON, proto } = require('@whiskeysockets/baileys');

// In-memory cache for credentials during the unconfirmed pairing phase.
// This ensures that before a staff user clicks "Confirm & Assign", NO rows
// are inserted into MySQL, and NO auto-increment IDs are burned.
const memoryAuthState = new Map();

/**
 * Custom MySQL Auth State implementation for Baileys.
 * Holds credentials in memory until confirmed, and only updates MySQL once confirmed.
 */
async function useMySQLAuthState(sessionId) {
  // Load existing confirmed session record from MySQL
  const [rows] = await pool.query(
    'SELECT creds_json, status, is_active FROM whatsapp_qr_sessions WHERE session_id = ?',
    [sessionId]
  );

  let creds;
  let keys = {};
  let isConfirmedInDb = rows.length > 0 && rows[0].status === 'connected' && rows[0].is_active === 1;

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
  } else if (memoryAuthState.has(sessionId)) {
    // Session in pairing phase: use memory state
    const mem = memoryAuthState.get(sessionId);
    creds = mem.creds;
    keys = mem.keys;
  } else {
    creds = initAuthCreds();
    keys = {};
  }

  const saveState = async () => {
    try {
      // 1. Always keep the in-memory state updated
      memoryAuthState.set(sessionId, { creds, keys });

      // 2. Check if the session is confirmed in MySQL
      if (!isConfirmedInDb) {
        const [check] = await pool.query(
          'SELECT id, status, is_active FROM whatsapp_qr_sessions WHERE session_id = ? LIMIT 1',
          [sessionId]
        );
        if (check.length > 0 && check[0].status === 'connected' && check[0].is_active === 1) {
          isConfirmedInDb = true;
        }
      }

      // 3. ONLY execute an UPDATE in MySQL if the session has officially been confirmed!
      // This uses a pure UPDATE which NEVER touches or burns AUTO_INCREMENT IDs.
      if (isConfirmedInDb) {
        const serialized = JSON.stringify({ creds, keys }, BufferJSON.replacer);
        await pool.query(
          'UPDATE whatsapp_qr_sessions SET creds_json = ?, updated_at = NOW() WHERE session_id = ?',
          [serialized, sessionId]
        );
      }
    } catch (err) {
      console.error('[WhatsApp AuthState] Error updating auth state in MySQL:', err);
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

function getMemoryCreds(sessionId) {
  if (memoryAuthState.has(sessionId)) {
    return JSON.stringify(memoryAuthState.get(sessionId), BufferJSON.replacer);
  }
  return null;
}

function clearMemoryCreds(sessionId) {
  memoryAuthState.delete(sessionId);
}

module.exports = {
  useMySQLAuthState,
  getMemoryCreds,
  clearMemoryCreds
};

