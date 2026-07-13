const router = require('express').Router();
const c = require('../controllers/ctwa.controller');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, c.getLinks);
router.post('/', authenticate, c.createLink);
router.get('/:id/analytics', authenticate, c.getLinkAnalytics);
router.delete('/:id', authenticate, c.deleteLink);

module.exports = router;
