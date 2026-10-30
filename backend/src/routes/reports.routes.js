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
router.get('/leads/daily-report', c.getDailyReport);
router.get('/daily', c.getDailyReport);
router.get('/leads/team-productivity', c.getTeamProductivityReport);
router.get('/leads/creation', c.getLeadCreationReport);
router.get('/leads/flow', c.getLeadFlowReport);
router.get('/lead-flow', c.getLeadFlowReport);
router.get('/conversation', c.getConversationReport);

// Application Reports
router.get('/applications/status-summary', c.getApplicationStatusSummaryReport);
router.get('/pipeline-kpis', c.getPipelineKpiReport);

// Work and Employee Reports
router.get('/work', c.getWorkReport);
router.get('/time-track', c.getTimeTrackReport);
router.get('/employee', c.getEmployeeReport);

// Receipts Report
router.get('/receipts/monthly-analysis', c.getMonthlyReceiptAnalysis);
router.get('/receipts', c.getReceiptsReport);


// Sales Performance Routes
// router.get('/sales/achievements', c.getSalesAchievements);
// router.get('/sales/leaderboard', c.getSalesLeaderboard);
// router.get('/sales/underperformers', c.getSalesUnderperformers);
// router.get('/sales/incentives', c.getSalesIncentives);
// router.get('/sales/targets', c.getSalesTargets);

module.exports = router;
