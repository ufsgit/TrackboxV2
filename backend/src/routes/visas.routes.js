const router = require('express').Router();
const c = require('../controllers/visas.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/contact/:contactId', c.getContactVisa);
router.post('/', c.saveVisa);
router.get('/contact/:contactId/history', c.getVisaHistory);

module.exports = router;
