const express = require('express');
const router = express.Router();
const c = require('../controllers/applications.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// All routes here should be protected by auth middleware in server.js
router.get('/contact/:contactId', c.getApplications);
router.post('/', c.createApplication);
router.put('/:id', c.updateApplication);
router.delete('/:id', c.deleteApplication);
router.get('/:applicationId/history', c.getApplicationHistory);

module.exports = router;
