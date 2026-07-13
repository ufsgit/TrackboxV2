const router = require('express').Router();
const c = require('../controllers/drip.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/', c.getDrip);
router.post('/', c.createDrip);
router.put('/:id', c.updateDrip);
router.delete('/:id', c.deleteDrip);
router.post('/:id/enroll', c.enrollContacts);
router.get('/:id/stats', c.getDripStats);

module.exports = router;
