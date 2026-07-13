const router = require('express').Router();
const c = require('../controllers/chatbots.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', c.getChatbots);
router.post('/', c.createChatbot);
router.put('/:id', c.updateChatbot);
router.delete('/:id', c.deleteChatbot);
router.post('/:id/test', c.testChatbot);

module.exports = router;
