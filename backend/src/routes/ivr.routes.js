const router = require('express').Router();
const c = require('../controllers/ivr.controller');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, c.getFlows);
router.post('/', authenticate, c.createFlow);
router.put('/:id', authenticate, c.updateFlow);
router.delete('/:id', authenticate, c.deleteFlow);
router.get('/:id/logs', authenticate, c.getCallLogs);

module.exports = router;
