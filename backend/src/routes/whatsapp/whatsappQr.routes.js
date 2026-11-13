const express = require('express');
const router = express.Router();
const whatsappQrController = require('../../controllers/whatsapp/whatsappQr.controller');
const authenticate = require('../../middleware/authenticate');

router.post('/confirm', authenticate, whatsappQrController.confirmAssignment);
router.get('/status/:sessionId', authenticate, whatsappQrController.getVerificationStatus);
router.post('/disconnect', authenticate, whatsappQrController.disconnectSession);

module.exports = router;

