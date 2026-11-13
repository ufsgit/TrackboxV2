const { confirmSessionAssignment, disconnectUserSession, pendingVerifications } = require('../../services/whatsapp/baileysSession.service');
const { getSessionByUserId } = require('../../models/whatsapp/WhatsappQrSession');

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

module.exports = {
  confirmAssignment,
  getVerificationStatus,
  disconnectSession
};

