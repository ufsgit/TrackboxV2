const router = require('express').Router();
const c = require('../controllers/conversations.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', c.getConversations);
router.post('/', c.createConversation);
router.get('/:id/messages', c.getMessages);
router.post('/:id/messages', c.sendMessage);
router.post('/:id/messages/template', c.sendTemplateMessage);
router.patch('/:id/assign', c.assignConversation);
router.patch('/:id/status', c.updateStatus);
router.delete('/:id', c.deleteConversation);

module.exports = router;
