const router = require('express').Router();
const c = require('../../controllers/excel-export/lead-creation-export.controller');

router.get('/', c.exportLeadCreation);

module.exports = router;

