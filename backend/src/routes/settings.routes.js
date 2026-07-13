const router = require('express').Router();
const c = require('../controllers/settings.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);
router.get('/business', c.getBusiness);
router.put('/business', requireRole('admin', 'superadmin'), c.updateBusiness);
router.get('/team', c.getTeam);
router.post('/team', requireRole('admin', 'superadmin'), c.inviteAgent);
router.put('/team/:id', requireRole('admin', 'superadmin'), c.updateAgent);
router.delete('/team/:id', requireRole('admin', 'superadmin'), c.deleteAgent);
router.get('/billing', c.getBilling);
router.post('/whatsapp/test', requireRole('admin', 'superadmin'), c.testWhatsAppConnection);

// Social Media Accounts Management Routes
router.get('/social-accounts', c.getSocialAccounts);
router.post('/social-accounts', requireRole('admin', 'superadmin'), c.createSocialAccount);
router.put('/social-accounts/:id', requireRole('admin', 'superadmin'), c.updateSocialAccount);
router.delete('/social-accounts/:id', requireRole('admin', 'superadmin'), c.deleteSocialAccount);
router.post('/social-accounts/:id/test', requireRole('admin', 'superadmin'), c.testSocialAccountConnection);

// Lead Fields (Custom Fields) Routes
router.get('/lead-fields', c.getLeadFields);
router.post('/lead-fields', requireRole('admin', 'superadmin'), c.createLeadField);
router.put('/lead-fields/:id', requireRole('admin', 'superadmin'), c.updateLeadField);
router.delete('/lead-fields/:id', requireRole('admin', 'superadmin'), c.deleteLeadField);

module.exports = router;
