const router = require('express').Router();
const c = require('../../controllers/excel-export/upcoming-followups-export.controller');

router.get('/', c.exportUpcomingFollowups);

module.exports = router;

