const express = require('express');
const router = express.Router();
const universitiesController = require('../controllers/universities.controller');

router.get('/', universitiesController.getAllUniversities);
router.post('/bulk', universitiesController.createBulkUniversities);
router.post('/', universitiesController.createUniversity);
router.put('/:id', universitiesController.updateUniversity);
router.delete('/:id', universitiesController.deleteUniversity);

module.exports = router;

