const router = require('express').Router();
const c = require('../controllers/system-settings.controller');
const authenticate = require('../middleware/authenticate');

// Allow authenticated users to fetch country codes
router.use(authenticate);

router.get('/', c.getCountryCodes);

module.exports = router;

