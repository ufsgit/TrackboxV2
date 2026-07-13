const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authenticate');

// All attendance routes require authentication
router.use(authenticate);

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/status', attendanceController.getStatus);
router.get('/report', attendanceController.getReport);

module.exports = router;
