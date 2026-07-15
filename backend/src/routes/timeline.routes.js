const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timeline.controller');
const authMiddleware = require('../middleware/authenticate');

router.get('/:contactId', authMiddleware, timelineController.getContactTimeline);

module.exports = router;
