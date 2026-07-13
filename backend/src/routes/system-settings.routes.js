const router = require('express').Router();
const c = require('../controllers/system-settings.controller');
const authenticate = require('../middleware/authenticate');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);

// Branches
router.get('/branches', c.getBranches);
router.post('/branches', requireRole('admin', 'superadmin'), c.createBranch);
router.put('/branches/:id', requireRole('admin', 'superadmin'), c.updateBranch);
router.delete('/branches/:id', requireRole('admin', 'superadmin'), c.deleteBranch);

// Departments
router.get('/departments', c.getDepartments);
router.post('/departments', requireRole('admin', 'superadmin'), c.createDepartment);
router.put('/departments/:id', requireRole('admin', 'superadmin'), c.updateDepartment);
router.delete('/departments/:id', requireRole('admin', 'superadmin'), c.deleteDepartment);

// Statuses
router.get('/statuses', c.getStatuses);
router.post('/statuses', requireRole('admin', 'superadmin'), c.createStatus);
router.put('/statuses/:id', requireRole('admin', 'superadmin'), c.updateStatus);
router.delete('/statuses/:id', requireRole('admin', 'superadmin'), c.deleteStatus);

module.exports = router;
