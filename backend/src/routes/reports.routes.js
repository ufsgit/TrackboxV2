const router = require('express').Router();
const c = require('../controllers/reports.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// Lead Reports
router.get('/leads/enquiries', c.getEnquiriesReport);
router.get('/leads/status', c.getStatusReport);
router.get('/leads/today', c.getTodaysLeadsReport);
router.get('/leads/pending-followups', c.getPendingFollowupsReport);
router.get('/leads/source-conversion', c.getSourceConversionReport);
router.get('/leads/channels', c.getChannelsReport);
router.get('/leads/won-lost', c.getWonLostReport);
router.get('/leads/channel-conversion', c.getChannelConversionReport);
router.get('/leads/employee-conversion', c.getEmployeeConversionReport);
router.get('/leads/student-pipeline', c.getStudentPipelineReport);
router.get('/leads/follow-up-report', c.getFollowUpReport);
router.get('/leads/team-productivity', c.getTeamProductivityReport);

// Work and Employee Reports
router.get('/work', c.getWorkReport);
router.get('/time-track', c.getTimeTrackReport);
router.get('/employee', c.getEmployeeReport);

module.exports = router;
