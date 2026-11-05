const router = require('express').Router();
const c = require('../../controllers/excel-export/todays-leads-export.controller');

router.get('/', c.exportTodaysLeads);

module.exports = router;

