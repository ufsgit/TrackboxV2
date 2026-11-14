const router = require('express').Router();
const c = require('../../controllers/contact_qualifications/contact_qualifications.controller');
const authenticate = require('../../middleware/authenticate');

router.use(authenticate);

// Get all qualifications for a contact
router.get('/contact/:contactId', c.getQualificationsByContact);

// Bulk save qualifications for a contact (insert, update, delete handled atomically)
router.post('/contact/:contactId', c.saveQualifications);

module.exports = router;
