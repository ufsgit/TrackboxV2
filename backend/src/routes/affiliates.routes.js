const router = require('express').Router();
const c = require('../controllers/affiliates.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.post('/join', c.joinAffiliate);
router.get('/dashboard', c.getDashboard);
router.get('/referrals', c.getReferrals);

module.exports = router;
