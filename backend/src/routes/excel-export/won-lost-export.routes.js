const router = require('express').Router();
const c = require('../../controllers/excel-export/won-lost-export.controller');

router.get('/', c.exportWonLost);

module.exports = router;

