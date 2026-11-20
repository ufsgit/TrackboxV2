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

// Document Types
router.get('/document-types', c.getDocumentTypes);
router.post('/document-types', requireRole('admin', 'superadmin'), c.createDocumentType);
router.put('/document-types/:id', requireRole('admin', 'superadmin'), c.updateDocumentType);
router.delete('/document-types/:id', requireRole('admin', 'superadmin'), c.deleteDocumentType);

// Teams
router.get('/teams', c.getTeams);
router.post('/teams', requireRole('admin', 'superadmin'), c.createTeam);
router.put('/teams/:id', requireRole('admin', 'superadmin'), c.updateTeam);
router.delete('/teams/:id', requireRole('admin', 'superadmin'), c.deleteTeam);

// Channels
router.get('/channels', c.getChannels);
router.post('/channels', c.createChannel);
router.put('/channels/:id', c.updateChannel);
router.delete('/channels/:id', c.deleteChannel);

// Country Codes
router.get('/country-codes', c.getCountryCodes);

// Visa Types
router.get('/visa-types', c.getVisaTypes);
router.post('/visa-types', requireRole('admin', 'superadmin', 'manager'), c.createVisaType);
router.put('/visa-types/:id', requireRole('admin', 'superadmin', 'manager'), c.updateVisaType);
router.delete('/visa-types/:id', requireRole('admin', 'superadmin', 'manager'), c.deleteVisaType);

// Visa Statuses
router.get('/visa-statuses', c.getVisaStatuses);
router.post('/visa-statuses', requireRole('admin', 'superadmin', 'manager'), c.createVisaStatus);
router.put('/visa-statuses/:id', requireRole('admin', 'superadmin', 'manager'), c.updateVisaStatus);
router.delete('/visa-statuses/:id', requireRole('admin', 'superadmin', 'manager'), c.deleteVisaStatus);

// Visa Reason Categories
router.get('/visa-reason-categories', c.getVisaReasonCategories);
router.post('/visa-reason-categories', requireRole('admin', 'superadmin', 'manager'), c.createVisaReasonCategory);
router.put('/visa-reason-categories/:id', requireRole('admin', 'superadmin', 'manager'), c.updateVisaReasonCategory);
router.delete('/visa-reason-categories/:id', requireRole('admin', 'superadmin', 'manager'), c.deleteVisaReasonCategory);

// Visa Pre-Departure Checklists (VISA-003)
router.get('/visa-checklists', c.getVisaChecklists);
router.post('/visa-checklists', requireRole('admin', 'superadmin', 'manager'), c.createVisaChecklist);
router.put('/visa-checklists/:id', requireRole('admin', 'superadmin', 'manager'), c.updateVisaChecklist);
router.delete('/visa-checklists/:id', requireRole('admin', 'superadmin', 'manager'), c.deleteVisaChecklist);

// Visa Pre-Departure Checklist Categories (VISA-003)
router.get('/visa-checklist-categories', c.getVisaChecklistCategories);
router.post('/visa-checklist-categories', requireRole('admin', 'superadmin', 'manager'), c.createVisaChecklistCategory);
router.put('/visa-checklist-categories/:id', requireRole('admin', 'superadmin', 'manager'), c.updateVisaChecklistCategory);
router.delete('/visa-checklist-categories/:id', requireRole('admin', 'superadmin', 'manager'), c.deleteVisaChecklistCategory);

module.exports = router;
