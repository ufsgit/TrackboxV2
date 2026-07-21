const router = require('express').Router();
const c = require('../controllers/settings.controller');
const fc = require('../controllers/field_categories.controller');
const sc = require('../controllers/source_categories.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);
router.get('/business', c.getBusiness);
router.put('/business', requireRole('admin', 'superadmin'), c.updateBusiness);
router.get('/team', c.getTeam);
router.post('/team', requireRole('admin', 'superadmin'), c.inviteAgent);
router.put('/team/:id/permissions', requireRole('admin', 'superadmin'), c.updatePermissions);
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

// Source Categories Routes
router.get('/source-categories', sc.getSourceCategories);
router.post('/source-categories', requireRole('admin', 'superadmin'), sc.createSourceCategory);
router.put('/source-categories/:id', requireRole('admin', 'superadmin'), sc.updateSourceCategory);
router.delete('/source-categories/:id', requireRole('admin', 'superadmin'), sc.deleteSourceCategory);

// Lead Fields (Custom Fields) Routes
router.get('/lead-fields', c.getLeadFields);
router.post('/lead-fields', requireRole('admin', 'superadmin'), c.createLeadField);
router.put('/lead-fields/:id', requireRole('admin', 'superadmin'), c.updateLeadField);
router.delete('/lead-fields/:id', requireRole('admin', 'superadmin'), c.deleteLeadField);

// Field Categories Routes
router.get('/field-categories', fc.getFieldCategories);
router.post('/field-categories', requireRole('admin', 'superadmin'), fc.createFieldCategory);
router.put('/field-categories/:id', requireRole('admin', 'superadmin'), fc.updateFieldCategory);
router.delete('/field-categories/:id', requireRole('admin', 'superadmin'), fc.deleteFieldCategory);

module.exports = router;
