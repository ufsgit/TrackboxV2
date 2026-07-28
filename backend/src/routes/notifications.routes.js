const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/', notificationsController.getNotifications);
router.put('/mark-read', notificationsController.markAsRead);
router.put('/mark-all-read', notificationsController.markAllAsRead);
router.delete('/clear-all', notificationsController.clearAllNotifications);

module.exports = router;
