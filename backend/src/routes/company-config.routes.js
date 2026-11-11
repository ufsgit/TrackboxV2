const express = require('express');
const router = express.Router();
const { getActiveCompanyConfig } = require('../controllers/company-config.controller');

router.get('/active', getActiveCompanyConfig);
router.get('/', getActiveCompanyConfig);

module.exports = router;

