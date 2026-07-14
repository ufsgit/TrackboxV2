const router = require('express').Router();
const c = require('../controllers/system-settings.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);

// Branches
router.get('/branches', c.getBranches);
router.post('/branches', requireRole('admin', 'superadmin'), c.createBranch);
router.put('/branches/:id', requireRole('admin', 'superadmin'), c.updateBranch);
router.delete('/branches/:id', requireRole('admin', 'superadmin'), c.deleteBranch);

// Departments
router.get('/departments', c.getDepartments);
router.post('/departments', requireRole('admin', 'superadmin'), c.createDepartment);
router.put('/departments/:id', requireRole('admin', 'superadmin'), c.updateDepartment);
router.delete('/departments/:id', requireRole('admin', 'superadmin'), c.deleteDepartment);

// Statuses
router.get('/statuses', c.getStatuses);
router.post('/statuses', requireRole('admin', 'superadmin'), c.createStatus);
router.put('/statuses/:id', requireRole('admin', 'superadmin'), c.updateStatus);
router.delete('/statuses/:id', requireRole('admin', 'superadmin'), c.deleteStatus);

// Designations
router.get('/designations', c.getDesignations);
router.post('/designations', requireRole('admin', 'superadmin'), c.createDesignation);
router.put('/designations/:id', requireRole('admin', 'superadmin'), c.updateDesignation);
router.delete('/designations/:id', requireRole('admin', 'superadmin'), c.deleteDesignation);

// Intakes
router.get('/intakes', c.getIntakes);
router.post('/intakes', requireRole('admin', 'superadmin'), c.createIntake);
router.put('/intakes/:id', requireRole('admin', 'superadmin'), c.updateIntake);
router.delete('/intakes/:id', requireRole('admin', 'superadmin'), c.deleteIntake);

// Years
router.get('/years', c.getYears);
router.post('/years', requireRole('admin', 'superadmin'), c.createYear);
router.put('/years/:id', requireRole('admin', 'superadmin'), c.updateYear);
router.delete('/years/:id', requireRole('admin', 'superadmin'), c.deleteYear);

// Application Statuses
router.get('/app-statuses', c.getAppStatuses);
router.post('/app-statuses', requireRole('admin', 'superadmin'), c.createAppStatus);
router.put('/app-statuses/:id', requireRole('admin', 'superadmin'), c.updateAppStatus);
router.delete('/app-statuses/:id', requireRole('admin', 'superadmin'), c.deleteAppStatus);

// Enquiry Fors
router.get('/enquiry-fors', c.getEnquiryFors);
router.post('/enquiry-fors', requireRole('admin', 'superadmin'), c.createEnquiryFor);
router.put('/enquiry-fors/:id', requireRole('admin', 'superadmin'), c.updateEnquiryFor);
router.delete('/enquiry-fors/:id', requireRole('admin', 'superadmin'), c.deleteEnquiryFor);

module.exports = router;
