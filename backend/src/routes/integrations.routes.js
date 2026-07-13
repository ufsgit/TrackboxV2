const router = require('express').Router();
const c = require('../controllers/integrations.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', c.getIntegrations);
router.post('/:type/connect', c.connectIntegration);
router.delete('/:type/disconnect', c.disconnectIntegration);
router.post('/openai/test', c.testOpenAI);
router.post('/google-sheets/sync', c.syncGoogleSheets);
router.post('/zoho/push-lead', c.pushZohoLead);
router.post('/hubspot/push-lead', c.pushHubspotLead);
router.get('/instagram/search-user', c.searchInstagramUser);
router.post('/instagram/start-chat', c.startInstagramChat);

module.exports = router;
