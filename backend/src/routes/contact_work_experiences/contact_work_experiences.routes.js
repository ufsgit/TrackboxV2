const router = require('express').Router();
const c = require('../../controllers/contact_work_experiences/contact_work_experiences.controller');
const authenticate = require('../../middleware/authenticate');

router.use(authenticate);

// Get all work experiences for a contact
router.get('/contact/:contactId', c.getWorkExperiencesByContact);

// Bulk save work experiences for a contact (insert, update, delete handled atomically)
router.post('/contact/:contactId', c.saveWorkExperiences);

module.exports = router;
