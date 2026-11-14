const express = require('express');
const router = express.Router();
const whatsappQrController = require('../../controllers/whatsapp/whatsappQr.controller');
const authenticate = require('../../middleware/authenticate');

router.get('/my-session', authenticate, whatsappQrController.getMyActiveSession);
router.post('/confirm', authenticate, whatsappQrController.confirmAssignment);
router.get('/status/:sessionId', authenticate, whatsappQrController.getVerificationStatus);
router.post('/disconnect', authenticate, whatsappQrController.disconnectSession);
router.get('/messages/:contactId', authenticate, whatsappQrController.getContactMessages);
router.post('/mark-read/:contactId', authenticate, whatsappQrController.markContactAsRead);

module.exports = router;

