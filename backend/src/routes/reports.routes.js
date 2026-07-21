const router = require('express').Router();
const c = require('../controllers/reports.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// Lead Reports
router.get('/leads/enquiries', c.getEnquiriesReport);
router.get('/leads/status', c.getStatusReport);
router.get('/leads/today', c.getTodaysLeadsReport);
router.get('/leads/pending-followups', c.getPendingFollowupsReport);

// Work and Employee Reports
router.get('/work', c.getWorkReport);
router.get('/employee', c.getEmployeeReport);

module.exports = router;
