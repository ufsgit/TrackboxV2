const router = require('express').Router();
const c = require('../../controllers/excel-export/pending-followup-export.controller');

router.get('/', c.exportPendingFollowups);

module.exports = router;

