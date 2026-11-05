const router = require('express').Router();
const c = require('../../controllers/excel-export/daily-report-export.controller');

router.get('/', c.exportDailyReport);

module.exports = router;

