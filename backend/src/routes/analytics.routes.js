const router = require('express').Router();
const c = require('../controllers/analytics.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/dashboard', c.getDashboard);
router.get('/messages', c.getMessagesAnalytics);
router.get('/broadcasts', c.getBroadcastsAnalytics);
router.get('/chatbots/:id', c.getChatbotAnalytics);
router.get('/crm-dashboard', c.getCrmDashboardStats);
router.get('/contacts/growth', c.getContactGrowth);

// Custom Reports Routes
router.get('/custom/employee-productivity', c.getEmployeeProductivity);
router.get('/custom/student-pipeline', c.getStudentPipeline);
router.get('/custom/follow-up', c.getFollowUpReport);
router.get('/custom/team-productivity', c.getTeamProductivity);
router.get('/custom/todays-activity', c.getTodaysActivity);
router.get('/custom/raw-data', c.getRawData);

module.exports = router;
