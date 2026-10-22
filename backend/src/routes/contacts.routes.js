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
router.post('/import-excel', c.importExcelContacts);
router.post('/preview-bulk-email', c.previewBulkEmail);
router.post('/send-bulk-email', c.sendBulkEmail);
router.post('/email-status/refresh', c.refreshEmailStatus);
router.post('/optin-link', c.createOptInLink);
router.get('/:id/history', c.getContactHistory);
router.get('/:id', c.getContact);
router.put('/:id', c.updateContact);
router.delete('/:id', c.deleteContact);
router.post('/:id/optin', c.optIn);
router.post('/:id/optout', c.optOut);

// User Document Uploads
router.get('/:id/documents', c.getContactDocuments);
router.post('/:id/documents', upload.single('file'), c.uploadContactDocument);
router.delete('/:id/documents/:docId', c.deleteContactDocument);

module.exports = router;
