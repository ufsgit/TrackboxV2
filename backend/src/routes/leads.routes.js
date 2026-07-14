const router = require('express').Router();
const c = require('../controllers/leads.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.post('/contacts/:contactId/leads', c.createLead);
router.get('/contacts/:contactId/leads', c.getContactLeads);
router.put('/leads/:id', c.updateLead);
router.delete('/leads/:id', c.deleteLead);

module.exports = router;
