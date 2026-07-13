const router = require('express').Router();
const c = require('../controllers/contacts.controller');
const authenticate = require('../middleware/authenticate');
const upload = require('../middleware/upload');

router.use(authenticate);
router.get('/', c.getContacts);
router.get('/export', c.exportContacts);
router.get('/tags', c.getUniqueTags);
router.post('/', c.createContact);
router.post('/import', upload.single('file'), c.importContacts);
router.post('/optin-link', c.createOptInLink);
router.get('/:id/history', c.getContactHistory);
router.get('/:id', c.getContact);
router.put('/:id', c.updateContact);
router.delete('/:id', c.deleteContact);
router.post('/:id/optin', c.optIn);
router.post('/:id/optout', c.optOut);

module.exports = router;
