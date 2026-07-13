const router = require('express').Router();
const c = require('../controllers/rcs.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/templates', c.getRcsTemplates);
router.post('/templates', c.createRcsTemplate);
router.put('/templates/:id', c.updateRcsTemplate);
router.delete('/templates/:id', c.deleteRcsTemplate);
router.get('/campaigns', c.getRcsCampaigns);
router.post('/campaigns', c.createRcsCampaign);
router.post('/campaigns/:id/send', c.sendRcsCampaign);
router.get('/campaigns/:id/analytics', c.getRcsCampaignAnalytics);

module.exports = router;
