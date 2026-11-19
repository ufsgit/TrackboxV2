const router = require('express').Router();
const c = require('../controllers/pte.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// Student PTE Management
router.get('/contact/:contactId', c.getPteByContactId);
router.post('/contact/:contactId', c.savePteEnrollment);

// Attendance
router.post('/contact/:contactId/attendance', c.addAttendance);
router.delete('/attendance/:id', c.deleteAttendance);

// Mock Tests
router.post('/contact/:contactId/mock-tests', c.addMockTest);
router.delete('/mock-tests/:id', c.deleteMockTest);

// Exams
router.post('/contact/:contactId/exams', c.addExam);

// Results & Target Achieved (PTE-003)
router.post('/contact/:contactId/results', c.addResult);

// Batches
router.get('/batches', c.getBatches);
router.post('/batches', c.createBatch);
router.put('/batches/:id', c.updateBatch);
router.delete('/batches/:id', c.deleteBatch);

// Trainers
router.get('/trainers', c.getTrainers);
router.post('/trainers', c.createTrainer);
router.put('/trainers/:id', c.updateTrainer);
router.delete('/trainers/:id', c.deleteTrainer);

// Statuses
router.get('/statuses', c.getStatuses);
router.post('/statuses', c.createStatus);
router.put('/statuses/:id', c.updateStatus);
router.delete('/statuses/:id', c.deleteStatus);

// Packages
router.get('/packages', c.getPackages);
router.post('/packages', c.createPackage);
router.put('/packages/:id', c.updatePackage);
router.delete('/packages/:id', c.deletePackage);

module.exports = router;
