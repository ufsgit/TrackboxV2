const router = require('express').Router();
const c = require('../controllers/visas.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// Listing, KPIs & Analytics
router.get('/', c.getVisaList);
router.get('/metrics', c.getVisaMetrics);
router.get('/deadline-alerts', c.getDeadlineAlerts);
router.get('/decline-analytics', c.getDeclineAnalytics);
router.get('/students', c.getAvailableStudents);
router.get('/staff', c.getVisaStaffList);

// Backward compatibility routes for contact profile
router.get('/contact/:contactId', c.getContactVisa);
router.get('/contact/:contactId/history', c.getVisaHistory);

// Visa Leads Report Page
router.get('/leads-report', c.getVisaLeadsReport);

// Single Case by ID & Save
router.get('/:id', c.getVisaById);
router.post('/', c.saveVisa);
router.delete('/:id', c.deleteVisa);

// VISA-001: Official requests from immigration (RFI/PPI)
router.post('/:id/requests', c.addVisaRequest);
router.patch('/:id/requests/:requestId', c.updateVisaRequest);
router.delete('/:id/requests/:requestId', c.deleteVisaRequest);

// VISA-003: Pre-departure checklist
router.patch('/:id/pre-departure', c.updatePreDeparture);

module.exports = router;
