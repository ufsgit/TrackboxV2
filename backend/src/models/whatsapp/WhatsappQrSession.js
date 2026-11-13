const pool = require('../../db/pool');

/**
 * Creates or updates a WhatsApp QR session record in MySQL
 */
async function saveOrUpdateSession({ sessionId, userId, businessId, phoneNumber, credsJson, status = 'pending', isActive = 1 }) {
  const [existing] = await pool.query(
    'SELECT id FROM whatsapp_qr_sessions WHERE session_id = ?',
    [sessionId]
  );

  if (existing.length > 0) {
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
    return existing[0].id;
  } else {
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

