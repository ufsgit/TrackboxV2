const pool = require('../../db/pool');
const { confirmSessionAssignment, disconnectUserSession, pendingVerifications } = require('../../services/whatsapp/baileysSession.service');
const { getSessionByUserId } = require('../../models/whatsapp/WhatsappQrSession');

/**
 * Gets the active connected WhatsApp session for the currently logged-in user
 */
const getMyActiveSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const [rows] = await pool.query(
      `SELECT s.session_id, s.phone_number, s.status, u.id as user_id, u.name as user_name, u.email, u.role
       FROM whatsapp_qr_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.user_id = ? AND s.status = 'connected' AND s.is_active = 1
       LIMIT 1`,
      [userId]
    );

    if (rows.length > 0) {
      return res.json({
        success: true,
        hasActiveSession: true,
        data: {
          sessionId: rows[0].session_id,
          phoneNumber: rows[0].phone_number,
          user: {
            id: rows[0].user_id,
            name: rows[0].user_name,
            email: rows[0].email,
            phone: rows[0].phone_number,
            role: rows[0].role
          }
        }
      });
    }

    return res.json({ success: true, hasActiveSession: false, data: null });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Confirms assignment of the WhatsApp session to the identified user staff
 */
const confirmAssignment = async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, message: 'sessionId and userId are required' });
    }

    const result = await confirmSessionAssignment(sessionId, userId);

    // Notify connected sockets for this session
    const io = req.app.get('io');
    if (io) {
      io.to(`session_${sessionId}`).emit('whatsapp_assigned_success', result);
    }

    return res.json({ success: true, message: result.message, data: result });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Checks verification status for a session
 */
const getVerificationStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const pending = pendingVerifications.get(sessionId);

    if (pending) {
      return res.json({
        success: true,
        status: 'pending_confirmation',
        phoneNumber: pending.phoneNumber,
        user: {
          id: pending.user.id,
          name: pending.user.name,
          email: pending.user.email,
          phone: pending.user.phone || pending.phoneNumber,
          role: pending.user.role
        }
      });
    }

    return res.json({ success: true, status: 'idle' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Disconnects an active or pending WhatsApp session
 */
const disconnectSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    await disconnectUserSession(sessionId);

    const io = req.app.get('io');
    if (io) {
      io.to(`session_${sessionId}`).emit('whatsapp_status_update', { sessionId, status: 'disconnected' });
    }

    return res.json({ success: true, message: 'WhatsApp session disconnected' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Gets message history for a contact via stored procedure `get_contact_whatsapp_messages`
 */
const getContactMessages = async (req, res) => {
  try {
    const { contactId } = req.params;
    if (!contactId) {
      return res.status(400).json({ success: false, message: 'contactId is required' });
    }

    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const offset = Math.max(0, parseInt(req.query.offset) || 0);

    const [spResult] = await pool.query(
      'CALL get_contact_whatsapp_messages(?, ?, ?)',
      [Number(contactId), limit, offset]
    );

    // MySQL CALL returns array of result sets; spResult[0] contains the selected rows
    const messages = spResult[0] || [];

    return res.json({
      success: true,
      data: {
        messages,
        limit,
        offset
      }
    });
  } catch (err) {
    console.error('[WhatsApp QR] Error in getContactMessages SP:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Marks messages for a contact as read and clears has_unread_wa on contacts table
 */
const markContactAsRead = async (req, res) => {
  try {
    const { contactId } = req.params;
    if (!contactId) {
      return res.status(400).json({ success: false, message: 'contactId is required' });
    }

    await pool.query('UPDATE contacts SET has_unread_wa = 0 WHERE id = ?', [contactId]);
    await pool.query("UPDATE whatsapp_messages SET status = 'read' WHERE contact_id = ? AND direction = 'inbound'", [contactId]);

    const io = req.app.get('io');
    if (io) {
      io.emit('whatsapp_unread_changed', { contactId: Number(contactId), has_unread_wa: 0 });
    }

    return res.json({ success: true, message: 'Marked as read', data: { contactId, has_unread_wa: 0 } });
  } catch (err) {
    console.error('[WhatsApp QR] Error marking contact as read:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMyActiveSession,
  confirmAssignment,
  getVerificationStatus,
  disconnectSession,
  getContactMessages,
  markContactAsRead
};

