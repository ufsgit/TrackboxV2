const { startBaileysSession, confirmSessionAssignment, disconnectUserSession } = require('../../services/whatsapp/baileysSession.service');

function initWhatsappQrSocket(io) {
  io.on('connection', (socket) => {
    // Client joins room for their specific session
    socket.on('join_whatsapp_qr', async (data) => {
      const sessionId = data?.sessionId || socket.id;
      socket.join(`session_${sessionId}`);
      console.log(`[WhatsApp Socket] Client joined session_${sessionId}`);

      // Start / trigger Baileys connection to yield QR or verify
      try {
        await startBaileysSession(sessionId, io);
      } catch (err) {
        console.error('[WhatsApp Socket] Error starting Baileys session:', err);
        socket.emit('whatsapp_error', { message: err.message || 'Failed to initialize WhatsApp session' });
      }
    });

    // Client requests a new/fresh QR code
    socket.on('request_whatsapp_qr', async (data) => {
      const sessionId = data?.sessionId || socket.id;
      try {
        await startBaileysSession(sessionId, io);
      } catch (err) {
        console.error('[WhatsApp Socket] Error refreshing WhatsApp QR:', err);
        socket.emit('whatsapp_error', { message: err.message || 'Failed to generate QR' });
      }
    });

    // Client confirms user assignment
    socket.on('confirm_whatsapp_user', async (data, callback) => {
      const { sessionId, userId } = data || {};
      try {
        const result = await confirmSessionAssignment(sessionId, userId);
        io.to(`session_${sessionId}`).emit('whatsapp_assigned_success', result);
        if (typeof callback === 'function') callback({ success: true, data: result });
      } catch (err) {
        console.error('[WhatsApp Socket] Error confirming session assignment:', err);
        if (typeof callback === 'function') callback({ success: false, message: err.message });
      }
    });

    // Client disconnects session
    socket.on('disconnect_whatsapp_session', async (data) => {
      const sessionId = data?.sessionId || socket.id;
      try {
        await disconnectUserSession(sessionId);
        io.to(`session_${sessionId}`).emit('whatsapp_status_update', { sessionId, status: 'disconnected' });
      } catch (err) {
        console.error('[WhatsApp Socket] Error disconnecting session:', err);
      }
    });
  });
}

module.exports = {
  initWhatsappQrSocket
};

