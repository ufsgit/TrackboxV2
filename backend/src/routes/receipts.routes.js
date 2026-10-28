const router = require('express').Router();
const c = require('../controllers/receipts.controller');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

router.get('/types', c.getReceiptTypes);
router.post('/types', c.createReceiptType);
router.put('/types/:id', c.updateReceiptType);
router.delete('/types/:id', c.deleteReceiptType);
router.get('/contact/:contactId', c.getContactReceipts);
router.post('/', c.createReceipt);
router.put('/:id', c.updateReceipt);
router.delete('/:id', c.deleteReceipt);

module.exports = router;
