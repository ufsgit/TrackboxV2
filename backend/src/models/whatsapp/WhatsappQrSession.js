const pool = require('../../db/pool');

/**
 * Creates or updates a WhatsApp QR session record in MySQL.
 * If a session already exists for this user_id, it updates that record to guarantee
 * only 1 active session per user.
 */
async function saveOrUpdateSession({ sessionId, userId, businessId, phoneNumber, credsJson, status = 'pending', isActive = 1 }) {
  // 1. If updating an active session by sessionId
  const [existingBySession] = await pool.query(
    'SELECT id, user_id FROM whatsapp_qr_sessions WHERE session_id = ? LIMIT 1',
    [sessionId]
  );

  // 2. If userId is provided, ensure any previous session record for this user is cleaned up
  if (userId) {
    // Delete any old session row for this user that isn't the current sessionId
    await pool.query(
      'DELETE FROM whatsapp_qr_sessions WHERE user_id = ? AND session_id != ?',
      [userId, sessionId]
    );
  }

  if (existingBySession.length > 0) {
    await pool.query(
      `UPDATE whatsapp_qr_sessions 
       SET user_id = COALESCE(?, user_id),
           business_id = COALESCE(?, business_id),
           phone_number = COALESCE(?, phone_number),
           creds_json = COALESCE(?, creds_json),
           status = ?,
           is_active = ?,
           updated_at = NOW()
       WHERE session_id = ?`,
      [userId || null, businessId || null, phoneNumber || null, credsJson || null, status, isActive, sessionId]
    );
    return existingBySession[0].id;
  } else {
    // If not existing by sessionId, check if we can update the user's row or insert a new one
    if (userId) {
      const [existingForUser] = await pool.query(
        'SELECT id FROM whatsapp_qr_sessions WHERE user_id = ? LIMIT 1',
        [userId]
      );
      if (existingForUser.length > 0) {
        await pool.query(
          `UPDATE whatsapp_qr_sessions 
           SET session_id = ?,
               business_id = COALESCE(?, business_id),
               phone_number = COALESCE(?, phone_number),
               creds_json = COALESCE(?, creds_json),
               status = ?,
               is_active = ?,
               updated_at = NOW()
           WHERE id = ?`,
          [sessionId, businessId || null, phoneNumber || null, credsJson || null, status, isActive, existingForUser[0].id]
        );
        return existingForUser[0].id;
      }
    }

    const [insertResult] = await pool.query(
      `INSERT INTO whatsapp_qr_sessions (session_id, user_id, business_id, phone_number, creds_json, status, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, userId || null, businessId || null, phoneNumber || null, credsJson || null, status, isActive]
    );
    return insertResult.insertId;
  }
}

/**
 * Finds an active session by user_id
 */
async function getSessionByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM whatsapp_qr_sessions 
     WHERE user_id = ? AND is_active = 1 AND status = 'connected'
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Finds a session by session_id
 */
async function getSessionBySessionId(sessionId) {
  const [rows] = await pool.query(
    'SELECT * FROM whatsapp_qr_sessions WHERE session_id = ? LIMIT 1',
    [sessionId]
  );
  return rows[0] || null;
}

/**
 * Deactivates or disconnects a session
 */
async function disconnectSession(sessionId) {
  await pool.query(
    `UPDATE whatsapp_qr_sessions 
     SET status = 'disconnected', is_active = 0, updated_at = NOW()
     WHERE session_id = ?`,
    [sessionId]
  );
}

module.exports = {
  saveOrUpdateSession,
  getSessionByUserId,
  getSessionBySessionId,
  disconnectSession
};

