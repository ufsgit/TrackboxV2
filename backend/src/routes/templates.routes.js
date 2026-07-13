const router = require('express').Router();
const c = require('../controllers/templates.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/sync', c.syncTemplates);
router.get('/', c.getTemplates);
router.post('/', c.createTemplate);
router.put('/:id', c.updateTemplate);
router.delete('/:id', c.deleteTemplate);
router.post('/:id/submit', c.submitTemplate);

module.exports = router;
