const router = require('express').Router();
const c = require('../controllers/sms.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/dlt-templates', c.getDltTemplates);
router.post('/dlt-templates', c.createDltTemplate);
router.put('/dlt-templates/:id', c.updateDltTemplate);
router.delete('/dlt-templates/:id', c.deleteDltTemplate);
router.get('/campaigns', c.getSmsCampaigns);
router.post('/campaigns', c.createSmsCampaign);
router.post('/campaigns/:id/send', c.sendSmsCampaign);
router.get('/campaigns/:id/report', c.getSmsCampaignReport);

module.exports = router;
