const router = require('express').Router();
const c = require('../controllers/ecommerce.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);
router.get('/products', c.getProducts);
router.post('/products', c.createProduct);
router.put('/products/:id', c.updateProduct);
router.delete('/products/:id', c.deleteProduct);
router.get('/orders', c.getOrders);
router.post('/orders', c.createOrder);
router.patch('/orders/:id/status', c.updateOrderStatus);
router.post('/orders/:id/send-confirmation', c.sendOrderConfirmation);

module.exports = router;
