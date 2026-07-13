const router = require('express').Router();
const c = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/dashboard', c.getDashboard);
router.get('/messages', c.getMessagesAnalytics);
router.get('/broadcasts', c.getBroadcastsAnalytics);
router.get('/chatbots/:id', c.getChatbotAnalytics);
router.get('/contacts/growth', c.getContactGrowth);

module.exports = router;
