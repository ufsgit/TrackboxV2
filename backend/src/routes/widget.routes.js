const router = require('express').Router();
const c = require('../controllers/widget.controller');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, c.getWidgets);
router.post('/', authenticate, c.createWidget);
router.put('/:id', authenticate, c.updateWidget);
router.delete('/:id', authenticate, c.deleteWidget);
// Public routes
router.get('/:token/config', c.getWidgetConfig);
router.get('/:token/embed.js', c.getEmbedJs);
router.post('/:token/message', c.handleWidgetMessage);

module.exports = router;
