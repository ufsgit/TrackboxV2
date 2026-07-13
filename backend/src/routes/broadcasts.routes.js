const router = require('express').Router();
const c = require('../controllers/broadcasts.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', c.getBroadcasts);
router.get('/audience-count', c.getAudienceCount);
router.post('/', c.createBroadcast);
router.post('/:id/send', c.sendBroadcast);
router.get('/:id/analytics', c.getBroadcastAnalytics);
router.delete('/:id', c.deleteBroadcast);

module.exports = router;
