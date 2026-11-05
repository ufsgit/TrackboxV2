const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');

// All excel export routes require authentication
router.use(authenticate);

// Mount individual export sub-routers
router.use('/won-lost', require('./won-lost-export.routes'));
router.use('/daily-report', require('./daily-report-export.routes'));
router.use('/lead-creation', require('./lead-creation-export.routes'));
router.use('/pending-followup', require('./pending-followup-export.routes'));
router.use('/upcoming-followups', require('./upcoming-followups-export.routes'));
router.use('/todays-leads', require('./todays-leads-export.routes'));

module.exports = router;

